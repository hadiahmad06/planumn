type Props = {
  course: {
    subject: string;
    number: string;
    title: string;
    credits: number;
    lock?: string;
  };
};

export default function CourseCardPreview({ course }: Props) {
  return (
    <div className="absolute z-50 hidden group-hover:block group-focus:block left-full ml-2 w-64 p-2 text-xs text-black bg-white border rounded shadow-lg transition-opacity duration-200 delay-500 group-hover:delay-500">
      <strong>{course.title}</strong>
      <div>Credits: {course.credits}</div>
      <div className="italic text-gray-500 mt-1">Prereqs: TBD</div>
      {course.lock && <div className="mt-1 text-xs font-semibold">Lock: {course.lock}</div>}
    </div>
  );
} 