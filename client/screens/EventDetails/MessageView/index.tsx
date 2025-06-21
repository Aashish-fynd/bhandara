import { getChildMessagesForThread, getMessageById, getMessagesForThread } from "@/common/api/messages.action";
import { BackButtonHeader } from "@/components/ui/common-components";
import { SpinningLoader } from "@/components/ui/Loaders";
import { PLATFORM_SOCKET_EVENTS } from "@/constants/global";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/Socket";
import { IBaseThread, IBaseUser, IMessage, IPaginationResponse } from "@/definitions/types";
import { useDataLoader } from "@/hooks";
import useSocketListener from "@/hooks/useSocketListener";
import { memo, useCallback, useRef, useState } from "react";
import { useDebounce, View, YStack, YStackProps } from "tamagui";
import MessageCard from "./MessageCard";
import { FlatList } from "react-native";
import { useToastController } from "@tamagui/toast";

enum ViewTypes {
  Thread = "thread",
  ChildMessages = "child",
  Message = "message",
  None = 0
}

type BaseCommonProps = {
  threadId?: string;
  parentId?: string;
  messageId?: string;
};

interface AddMessageProp extends IMessage {
  thread: IBaseThread;
  user: IBaseUser;
}

export { BaseCommonProps as IMessageViewBaseProps, AddMessageProp as IMessageViewAddMessageProp };

interface IProps extends BaseCommonProps {
  onBack: () => void;
  style: YStackProps["style"];
  handleClick: (data: BaseCommonProps) => void;
  parentRef?: React.MutableRefObject<{ addMessage: (msg: AddMessageProp) => void } | null>;
}

const MessageView = memo(({ threadId, parentId, messageId, onBack, handleClick, style, parentRef }: IProps) => {
  const toastController = useToastController();
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const paginationRef = useRef<IPaginationResponse>({ limit: 30, next: null, page: 1 });

  const headers = {
    [ViewTypes.Thread]: "Thread",
    [ViewTypes.Message]: "Message",
    [ViewTypes.ChildMessages]: "Messages",
    [ViewTypes.None]: ""
  };

  const methodExecutors = {
    [ViewTypes.Thread]: () => getMessagesForThread({ threadId: threadId || "", pagination: paginationRef.current }),
    [ViewTypes.Message]: () => getMessageById({ messageId: messageId || "", threadId: threadId || "" }),
    [ViewTypes.ChildMessages]: () =>
      getChildMessagesForThread({
        threadId: threadId || "",
        parentId: parentId || "",
        pagination: paginationRef.current
      }),
    [ViewTypes.None]: () => {}
  };

  const determineViewType = ({ threadId, parentId, messageId }: BaseCommonProps) => {
    if (parentId && threadId) return ViewTypes.ChildMessages;
    if (threadId && messageId) return ViewTypes.Message;
    if (threadId) return ViewTypes.Thread;
    return ViewTypes.None;
  };

  const currentView = determineViewType({ threadId, parentId, messageId });
  const getFormattedData = (data: any) => {
    const _data = data?.data;
    if (currentView === ViewTypes.ChildMessages) {
      paginationRef.current = _data?.pagination;
      return _data?.items || [];
    }
    if (currentView == ViewTypes.Message) {
      return _data;
    }
    if (currentView === ViewTypes.Thread) {
      paginationRef.current = data?.pagination;
      return _data?.items || [];
    }
  };

  async function methodExecutor(currentView: ViewTypes) {
    try {
      const data = await methodExecutors[currentView]();
      return getFormattedData(data);
    } catch (error: any) {
      toastController.show(error?.message || "Something went wrong");
    }
  }

  const { data, loading, setData } = useDataLoader({ promiseFunction: () => methodExecutor(currentView) });

  useSocketListener(
    PLATFORM_SOCKET_EVENTS.MESSAGE_UPDATED,
    ({ data, error }: { data: Record<string, any>; error: any }) => {
      console.log("data", { data, error });
      if (error) return;
      setData((prev) => prev.map((f) => (f.id === data.id ? { ...f, reactions: [...f.reactions, data.reaction] } : f)));
    }
  );

  useSocketListener(PLATFORM_SOCKET_EVENTS.MESSAGE_CREATED, ({ data, error }: { data: AddMessageProp; error: any }) => {
    if (error) return;
    if (data.threadId === threadId) {
      const { thread, ...rest } = data;
      setData((prev: IMessage[]) => [rest, ...prev]);
    }
  });

  const lastFetchedNext = useRef<string | null>(null);

  const handleEndReached = async () => {
    if ([ViewTypes.Message, ViewTypes.None].includes(currentView)) return;
    const currentPagination = paginationRef.current;

    const shouldPaginate =
      !isFetchingMore &&
      currentPagination?.next !== lastFetchedNext.current &&
      (currentPagination?.next || currentPagination?.page);

    if (shouldPaginate) {
      try {
        setIsFetchingMore(true);
        lastFetchedNext.current = currentPagination?.next ?? `page-${currentPagination.page + 1}`;

        paginationRef.current = {
          ...currentPagination,
          page: currentPagination?.page ? currentPagination.page + 1 : 1,
          next: currentPagination?.next
        };

        const res = await methodExecutor(currentView);
        const newItems = res?.data?.items || [];
        const newPagination = res?.pagination || res?.data?.pagination;

        if (newItems.length) {
          setData((prev: any) => ({
            ...prev,
            data: {
              ...prev.data,
              items: [...prev.data?.items, ...newItems]
            }
          }));
          paginationRef.current = newPagination;
        }
      } catch (err: any) {
        toastController.show(err?.message || "Failed to load more messages");
      } finally {
        setIsFetchingMore(false);
      }
    }
  };

  const debouncedHandleEndReached = useCallback(useDebounce(handleEndReached, 300), []);

  return (
    <YStack
      gap={"$4"}
      width={"100%"}
      flex={1}
      style={style}
    >
      <BackButtonHeader
        title={headers[currentView]}
        arrowCb={onBack}
      />
      {loading ? (
        <View
          items={"center"}
          justify={"center"}
          height={"100%"}
          width={"100%"}
        >
          <SpinningLoader />
        </View>
      ) : (
        data && (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <MessageCard
                isFirst={index === 0}
                thread={{ id: threadId || "" }}
                message={item}
                handleClick={handleClick}
              />
            )}
            onEndReachedThreshold={0.15}
            onEndReached={debouncedHandleEndReached}
            ListFooterComponent={isFetchingMore ? <SpinningLoader /> : null}
            initialNumToRender={10}
          />
        )
      )}
    </YStack>
  );
});

export default MessageView;
