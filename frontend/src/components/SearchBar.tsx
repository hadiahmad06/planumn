"use client";

import { useState, useEffect } from "react";

type Course = {
  dept: string;
  number: string;
  title: string;
  credits: number;
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Course[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length === 0) {
        setResults([]);
        return;
      }

      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    };

    const delayDebounce = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="w-full mb-6">
      <input
        type="text"
        placeholder="Search by course name, department, or code..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 border rounded text-sm"
      />
      {results.length > 0 && (
        <ul className="mt-2 border rounded bg-white max-h-60 overflow-y-auto shadow">
          {results.map((course, index) => (
            <li key={index} className="px-4 py-2 border-b">
              <strong>{course.dept} {course.number}</strong>: {course.title} ({course.credits} cr)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}