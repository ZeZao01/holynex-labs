import { MessageCircle } from "lucide-react";

export default function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/554861360234"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-50 btn-glow-filled flex items-center justify-center w-14 h-14 rounded-full shadow-lg"
    >
      <MessageCircle className="h-6 w-6 text-primary-foreground" />
    </a>
  );
}
