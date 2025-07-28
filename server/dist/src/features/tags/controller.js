import TagsService from "./service";
import { pick } from "@utils";
import { formQueryFromObject } from "@features/helpers";
const tagsService = new TagsService();
export const getTags = async (req, res) => {
    const { eventId, createdBy, rootOnly } = req.query;
    if (rootOnly) {
        const rootTags = await tagsService.getRootTags();
        return res.status(200).json({ data: rootTags });
    }
    const query = formQueryFromObject({ eventId, createdBy });
    const tags = await tagsService.getAll({ query }, req.pagination);
    return res.status(200).json({ data: tags });
};
export const createTag = async (req, res) => {
    const createData = pick(req.body, ["name", "value", "description"]);
    const tag = await tagsService.create(createData);
    return res.status(201).json({ data: tag });
};
export const getTagById = async (req, res) => {
    const { tagId } = req.params;
    const tag = await tagsService.getById(tagId);
    return res.status(200).json({ data: tag });
};
export const updateTag = async (req, res) => {
    const { tagId } = req.params;
    const updateData = pick(req.body, ["name", "value", "description"]);
    const tag = await tagsService.update(tagId, updateData);
    return res.status(200).json({ data: tag });
};
export const deleteTag = async (req, res) => {
    const { tagId } = req.params;
    const tag = await tagsService.delete(tagId);
    return res.status(200).json({ data: tag });
};
export const getSubTags = async (req, res) => {
    const { tagId } = req.params;
    const subTags = await tagsService.getSubTags(tagId);
    return res.status(200).json({ data: subTags });
};
//# sourceMappingURL=controller.js.map