import ComingSoon from "../components/ComingSoon";

export default function Notifications() {
  return (
    <ComingSoon
      title="Notifications"
      description="View task updates, assignments, comments and system notifications."
      models={["Notification"]}
    />
  );
}