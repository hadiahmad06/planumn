"use client";

type Props = {
  colorByDepartment: boolean;
  colorByLevel: boolean;
  setColorByDepartment: (b: boolean) => void;
  setColorByLevel: (b: boolean) => void;
  onAutofill: () => void;
};

export default function SettingsPanel({
  colorByDepartment,
  colorByLevel,
  setColorByDepartment,
  setColorByLevel,
  onAutofill,
}: Props) {
  return (
    <div className="w-64 bg-white border border-border shadow-sm rounded-lg p-4 h-fit sticky top-8">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Settings</h2>
      <div className="text-sm text-secondary">
        <p className="mb-2 font-medium">Color Coding:</p>
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name="colorMode"
              checked={!colorByDepartment && !colorByLevel}
              onChange={() => {
                setColorByDepartment(false);
                setColorByLevel(false);
              }}
              className="form-radio text-primary focus:ring-primary"
            />
            <span className="ml-2">None</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name="colorMode"
              checked={colorByDepartment}
              onChange={() => {
                setColorByDepartment(true);
                setColorByLevel(false);
              }}
              className="form-radio text-primary focus:ring-primary"
            />
            <span className="ml-2">By Department</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name="colorMode"
              checked={colorByLevel}
              onChange={() => {
                setColorByLevel(true);
                setColorByDepartment(false);
              }}
              className="form-radio text-primary focus:ring-primary"
            />
            <span className="ml-2">By Course Level</span>
          </label>
        </div>
        <div className="mt-6">
          <button
            onClick={onAutofill}
            className="w-full mt-4 bg-primary hover:bg-primary-dark text-white text-sm py-2 px-4 rounded shadow-sm"
          >
            Autofill Plan
          </button>
        </div>
      </div>
    </div>
  );
}

