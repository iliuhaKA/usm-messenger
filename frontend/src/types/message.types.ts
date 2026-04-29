export interface Message {
  id: number;
  chatId: number;
  senderId: number | null;
  senderFirstName: string | null;
  senderLastName: string | null;
  content: string;
  createdAt: string;
}
