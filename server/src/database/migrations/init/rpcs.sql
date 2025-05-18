CREATE OR REPLACE FUNCTION create_event_with_associations(
  event_data JSONB,
  tag_ids UUID[],
  media_ids UUID[]
)
RETURNS "Event" AS $$
DECLARE
  new_event "Event";
  qna_thread_id UUID;
  discussion_thread_id UUID;
BEGIN
  -- Step 1: Insert the Event
  INSERT INTO "Event" (
    "name",
    "description",
    "location",
    "participants",
    "verifiers",
    "type",
    "createdBy",
    "status",
    "capacity"
  )
  VALUES (
    event_data->>'name',
    event_data->>'description',
    event_data->'location',
    event_data->'participants',
    event_data->'verifiers',
    (event_data->>'type')::"EventType",
    (event_data->>'createdBy')::UUID,
    (event_data->>'status')::"EventStatus",
    (event_data->>'capacity')::INTEGER
  )
  RETURNING * INTO new_event;

  -- Step 2: Create the Q&A Thread
  INSERT INTO "Thread" (
    "type",
    "status",
    "visibility",
    "lockHistory",
    "eventId"
  )
  VALUES (
    'qna',
    'public',
    'public',
    '{}'::JSONB,
    new_event.id
  )
  RETURNING id INTO qna_thread_id;

  -- Step 3: Create the Discussion Thread
  INSERT INTO "Thread" (
    "type",
    "status",
    "visibility",
    "lockHistory",
    "eventId"
  )
  VALUES (
    'discussion',
    'public',
    'public',
    '{}'::JSONB,
    new_event.id
  )
  RETURNING id INTO discussion_thread_id;

  -- Step 4: Associate Tags with the Event
  IF array_length(tag_ids, 1) > 0 THEN
    INSERT INTO "EventTags" ("eventId", "tagId")
    SELECT new_event.id, unnest(tag_ids);
  END IF;

  -- Step 5: Associate Media with the Event
  IF array_length(media_ids, 1) > 0 THEN
    INSERT INTO "EventMedia" ("eventId", "mediaId")
    SELECT new_event.id, unnest(media_ids);
  END IF;

  -- Return the newly created Event
  RETURN new_event;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_tags_with_children()
RETURNS TABLE (
    id UUID,
    name TEXT,
    value TEXT,
    description TEXT,
    icon TEXT,
    color TEXT,
    parentId UUID,
    createdBy UUID,
    createdAt TIMESTAMPTZ,
    updatedAt TIMESTAMPTZ,
    deletedAt TIMESTAMPTZ,
    hasChildren BOOLEAN
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.*,
    COUNT(c.id) > 0 AS "hasChildren"
  FROM "Tags" t
  LEFT JOIN "Tags" c ON c."parentId" = t."id" AND c."deletedAt" IS NULL
  WHERE t."deletedAt" IS NULL
  GROUP BY t."id";
END;
$$ LANGUAGE plpgsql STABLE;
