import { useTheme } from "../context/ThemeContext";

export default function ThemeSelector() {
  const { theme, changeTheme, themes } = useTheme();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-token">
          Appearance & Themes
        </h2>
        <p className="text-sm text-muted">
          Customize your WorkSpace experience.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((item) => {
          const active = theme === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => changeTheme(item.id)}
              aria-pressed={active}
              className="card text-left p-4 hover:shadow-lg transition-all"
              style={{
                border: active
                  ? `2px solid ${item.color}`
                  : "1px solid var(--border)",
                transform: active ? "translateY(-2px)" : "none",
              }}
            >
              {}
              <div
                className="rounded-xl p-3 mb-3"
                style={{
                  background:
                    item.id === "dark" || item.id === "cyber"
                      ? "#111827"
                      : item.id === "nord"
                      ? "#ECEFF4"
                      : "#F8FAFC",
                }}
              >
                <div className="flex gap-2">
                  <div
                    className="w-1/4 rounded-md h-16"
                    style={{
                      background: item.color,
                    }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-3 rounded"
                      style={{
                        background: item.color,
                        width: "75%",
                      }}
                    />
                    <div className="h-2 rounded bg-gray-300 w-full" />
                    <div className="h-2 rounded bg-gray-200 w-3/4" />
                    <div
                      className="h-5 rounded-md w-1/2"
                      style={{
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              {}
              <div className="flex justify-between items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm text-token">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted">
                    {item.type} Theme
                  </p>
                </div>

                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: item.color,
                    color: "#FFFFFF",
                  }}
                >
                  {active ? "✓" : ""}
                </div>
              </div>

              {active && (
                <p
                  className="text-xs font-semibold mt-3"
                  style={{ color: item.color }}
                >
                  Currently Active
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
