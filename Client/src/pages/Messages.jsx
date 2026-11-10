import ComingSoon from "../components/ComingSoon";

export default function Messages() {
  return (
    <ComingSoon
      title="Team Communication"
      description="Manage direct conversations, team chats and message read receipts."
      models={["Conversation", "ConversationMember", "Message", "MessageReadReceipt"]}
    />
  );
}