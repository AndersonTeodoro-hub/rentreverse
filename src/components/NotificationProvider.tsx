import { useOfferNotifications } from "@/hooks/useOfferNotifications";

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  useOfferNotifications();
  return <>{children}</>;
};

export default NotificationProvider;
