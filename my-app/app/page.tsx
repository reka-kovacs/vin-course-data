"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  Table,
  PaginationState,
  ColumnPinningState,
  RowData,
} from "@tanstack/react-table";
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

// TYPES
type RawRecord = {
  participant_id: number;
  course_id: number;
  course_title: string | null;
  completion: number | null;
  last_accessed: string | null;
};

type CellData = {
  completion: number | null;
  last_accessed: string | null;
  metadata?: {
    time_last_accessed: string;
  };
};

type RowInfo = {
  participant_id: number;
  [courseID: number]: CellData | number;
};

type Course = {
  id: number;
  title: string;
};

// TData
type TransformedData = {
  rows: RowInfo[];
  courses: Course[];
};

// TRANSFORMATION
function transformForTable(data: RawRecord[]): TransformedData {
  const participants: Record<number, RowInfo> = {};
  const coursesMap = new Map<number, string>();

  data.forEach((row) => {
    const {
      participant_id,
      course_id,
      course_title,
      completion,
      last_accessed,
    } = row;

    if (!participants[participant_id]) {
      participants[participant_id] = {
        participant_id,
      };
    }

    participants[participant_id][course_id] = {
      completion,
      last_accessed,
      metadata: {
        time_last_accessed: last_accessed || "",
      },
    };

    if (!coursesMap.has(course_id)) {
      coursesMap.set(course_id, course_title || `Course ${course_id}`);
    }
  });

  return {
    rows: Object.values(participants),
    courses: Array.from(coursesMap.entries()).map(([id, title]) => ({
      id,
      title,
    })),
  };
}

// HELPERS
function formatCell(cell?: CellData) {
  if (!cell) return "-";

  const percent =
    cell.completion != null ? `${(cell.completion * 100).toFixed(0)}%` : "N/A";

  const date = cell.last_accessed
    ? new Date(cell.last_accessed).toLocaleDateString()
    : "—";
  const time = cell.last_accessed
    ? new Date(cell.last_accessed).toLocaleTimeString()
    : "—";

  return `${percent}\n${date}`;
}

function getColor(completion?: number | null) {
  if (completion == null) return "transparent";
  if (completion < 0.5) return "#f87171";
  if (completion < 0.8) return "#facc15";
  return "#4ade80";
}

// COMPONENT
export default function MyTable() {
  const [data, setData] = useState<TransformedData>({
    rows: [],
    courses: [],
  });

  const [sorting, setSorting] = useState<SortingState>([]);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: [],
  });

  useEffect(() => {
    fetch("http://localhost:3001/api/progress")
      .then((res) => res.json())
      .then((raw: RawRecord[]) => {
        const transformed = transformForTable(raw);
        setData(transformed);
      })
      .catch((err) => console.error("Failed to fetch data:", err));
  }, []);

  const columns = useMemo(() => {
    return [
      {
        accessorKey: "participant_id",
        header: "Participant ID",
        meta: {
          className: "sticky left-0",
        },
      },
      ...data.courses.map((course) => ({
        id: String(course.id),
        header: String(course.id),
        cell: ({ row }: any) => {
          const cell: CellData | undefined = row.original[course.id];

          return (
            <div
              style={{
                whiteSpace: "pre-line",
                padding: "6px",
                borderRadius: "6px",
                backgroundColor: getColor(cell?.completion),
              }}
            >
              {formatCell(cell)}
            </div>
          );
        },
      })),
    ];
  }, [data]);

  const table = useReactTable({
    data: data.rows,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnPinningChange: setColumnPinning,
    onPaginationChange: setPagination,
    //no need to pass pageCount or rowCount with client-side pagination as it is calculated automatically
    state: {
      pagination,
      sorting,
      columnPinning,
    },
    // autoResetPageIndex: false, // turn off page index reset when sorting or filtering
  });

  return (
    <div>
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            VIN Course Progress
          </div>

          {/* CTA Button */}
          <a
            href="#"
            className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-700 transition"
          >
            Learn More
          </a>
        </div>
      </header>

      <div style={{ overflowX: "auto" }}>
        <div style={{ padding: "20px", overflowX: "scroll" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: "800px",
            }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      className={`${
                        header.column.columnDef.meta?.className ?? ""
                      }`}
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        border: "1px solid #ddd",
                        padding: "10px",
                        cursor: "pointer",
                        background: "#e0e7f4",
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                      className={`${
                        cell.column.columnDef.meta?.className ?? ""
                      }`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-2" />
        <div className="flex items-center gap-2">
          <button
            className="border rounded p-1"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            {">>"}
          </button>
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount().toLocaleString()}
            </strong>
          </span>
          <span className="flex items-center gap-1">
            | Go to page:
            <input
              type="number"
              min="1"
              max={table.getPageCount()}
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              className="border p-1 rounded w-16"
            />
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div>
          Showing {table.getRowModel().rows.length.toLocaleString()} of{" "}
          {table.getRowCount().toLocaleString()} Rows
        </div>
      </div>
    </div>
  );
}
