import ComingSoon from "../components/ComingSoon";

export default function Settings() {
  return (
    <ComingSoon
      title="Workspace Settings"
      description="Manage system preferences, workspace configuration and account settings."
      models={["SystemSetting", "ActivityLog"]}
    />
  );
}