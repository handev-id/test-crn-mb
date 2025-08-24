import { socket } from "./lib/socket";
import { client, Conversation } from "./lib/axios";
import { useForm } from "react-hook-form";
import { Attachment, FormData as FormDataType } from "./lib/types";
import { useEffect } from "react";

const Form = ({
  bodyMsgs,
  replyId,
  activeConversation,
}: {
  bodyMsgs: React.MutableRefObject<HTMLDivElement | null>;
  replyId: string | null;
  activeConversation: Conversation | null;
}) => {
  const { register, handleSubmit, setValue } = useForm<FormDataType>();

  const onSubmit = async (data: FormDataType) => {
    let attachment: Attachment | null = null;

    if (data.attachment?.[0]) {
      const formData = new FormData();
      formData.append("file", data.attachment[0]);
      const response = await client.post("/attachment", formData);
      attachment = response.data;
    }

    socket.emit(
      "send-message",
      {
        conversationId: activeConversation?.id,
        channelId: activeConversation?.channelId,
        senderId: 1,
        text: data.text || null,
        attachment,
        webhookMessageReplyId: data.webhookMessageReplyId || null,
      },
      (result: any) => {
        console.log(result);
      }
    );

    setValue("text", "");
    setTimeout(() => {
      bodyMsgs.current?.scroll({ top: bodyMsgs.current.scrollHeight });
    }, 500);
  };

  useEffect(() => {
    if (replyId) {
      setValue("webhookMessageReplyId", replyId);
    } else {
      setValue("webhookMessageReplyId", null);
    }
  }, [replyId]);
  return (
    <form
      className="p-4 border-t flex flex-col gap-3"
      onSubmit={handleSubmit(onSubmit)}
    >
      <input
        {...register("text")}
        placeholder="Type a message..."
        className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="file"
        {...register("attachment")}
        className="border rounded-lg px-3 py-2 text-sm"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition"
      >
        Send
      </button>
    </form>
  );
};

export default Form;
