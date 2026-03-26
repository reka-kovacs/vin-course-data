"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClientSideRowModelModule,
  ColDef,
  ColumnApiModule,
  ColumnAutoSizeModule,
  ValidationModule,
  themeQuartz,
  CellStyleModule,
  ModuleRegistry,
  PaginationModule,
} from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import { RowInfo, RawRecord, TransformedData, CellData } from "./types";
const modules = [
  CellStyleModule,
  PaginationModule,
  ColumnApiModule,
  ColumnAutoSizeModule,
  ClientSideRowModelModule,
  CellStyleModule,
  ...(process.env.NODE_ENV !== "production" ? [ValidationModule] : []),
];

ModuleRegistry.registerModules(modules);

export const myTheme = themeQuartz.withParams({
  accentColor: "#15BDE8",
  backgroundColor: "#0C0C0D",
  borderColor: "#ffffff00",
  borderRadius: 20,
  browserColorScheme: "dark",
  cellHorizontalPaddingScale: 1,
  chromeBackgroundColor: {
    ref: "backgroundColor",
  },
  columnBorder: false,
  fontFamily: {
    googleFont: "Roboto",
  },
  fontSize: 16,
  foregroundColor: "#BBBEC9",
  headerBackgroundColor: "#182226",
  headerFontWeight: 500,
  headerTextColor: "#FFFFFF",
  headerVerticalPaddingScale: 0.9,
  iconSize: 20,
  rowBorder: true,
  rowVerticalPaddingScale: 1.2,
  sidePanelBorder: false,
  spacing: 8,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

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
  const [rowData, setRowData] = useState<RowInfo[]>([]);
  const [colDefs, setColDefs] = useState<any>([]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      flex: 1,
      minWidth: 120,
      resizable: true,
    };
  }, []);

  // const [sorting, setSorting] = useState<SortingState>([]);

  // const [pagination, setPagination] = React.useState<PaginationState>({
  //   pageIndex: 0,
  //   pageSize: 10,
  // });

  // const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
  //   left: [],
  //   right: [],
  // });
  const datasource = {
    getRows: async (params: any) => {
      const { startRow, endRow, sortModel } = params.request;

      const pageSize = endRow - startRow;
      const page = startRow / pageSize;

      const sort = sortModel[0];
      const sortField = sort?.colId;
      const sortDirection = sort?.sort;

      try {
        const res = await fetch(
          `http://localhost:3001/api/progress?page=${page}&pageSize=${pageSize}&sortField=${sortField}&sortDir=${sortDirection}`,
        );

        const data = await res.json();

        const transformed = transformForTable(data.rows);

        params.success({
          rowData: transformed.rows,
          rowCount: data.totalCount, // total rows in DB
        });
      } catch (err) {
        console.error(err);
        params.fail();
      }
    },
  };

  useEffect(() => {
    fetch("http://localhost:3001/api/progress")
      .then((res) => res.json())
      .then((raw: RawRecord[]) => {
        const transformed = transformForTable(raw);

        setRowData(transformed.rows);

        const dynamicCols: ColDef[] = transformed.courses.map((course) => ({
          field: String(course.id),
          headerName: "Course " + String(course.id),
          sortable: true,
          valueFormatter: (params) => formatCell(params.value),
          cellStyle: function (params) {
            return {
              backgroundColor: getColor(params.value?.completion),
              color: "#faf5f5",
            };
          },
          comparator: (a: CellData, b: CellData) => {
            const valA = a?.completion ?? -1;
            const valB = b?.completion ?? -1;
            return valA - valB;
          },
        }));

        const cols: ColDef[] = [
          {
            field: "participant_id",
            headerName: "Participant",
            pinned: "left",
            sortable: true,
          },
          ...dynamicCols,
        ];

        setColDefs(cols);
      })
      .catch((err) => console.error("Failed to fetch data:", err));
  }, []);

  return (
    <div className="min-h-full">
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

      <div>
        <AgGridProvider modules={modules}>
          <div
            style={{
              width: "100%",
              height: "81vh",
              fontFamily: "Roboto, sans-serif",
            }}
          >
            <AgGridReact
              columnDefs={colDefs}
              theme={myTheme}
              defaultColDef={defaultColDef}
              multiSortKey="ctrl"
              rowModelType="serverSide"
              pagination={true}
              paginationPageSize={10}
              cacheBlockSize={10} // page size
              animateRows={true}
              onGridReady={(params) => {
                params.api.setGridOption("serverSideDatasource", datasource);
              }}
            />
          </div>
        </AgGridProvider>
      </div>
    </div>
  );
}
