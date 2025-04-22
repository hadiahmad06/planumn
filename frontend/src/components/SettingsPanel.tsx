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
    <div className="w-64 bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 h-fit sticky top-8">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      <div className="text-sm text-gray-700 dark:text-gray-200">
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
              className="form-radio"
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
              className="form-radio"
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
              className="form-radio"
            />
            <span className="ml-2">By Course Level</span>
          </label>
        </div>
        <div className="mt-6">
          <button
            onClick={onAutofill}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded"
          >
            Autofill Plan
          </button>
        </div>
      </div>
    </div>
  );
}

