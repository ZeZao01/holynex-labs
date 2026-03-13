import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export interface BaseColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (item: T) => ReactNode;
}

interface BaseTableProps<T> {
  columns: BaseColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  loadingRows?: number;
}

export default function BaseTable<T>({ columns, data, keyExtractor, loading, loadingRows = 5 }: BaseTableProps<T>) {
  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => <TableHead key={col.key} className={col.className}>{col.header}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: loadingRows }).map((_, i) => (
            <TableRow key={i}>
              {columns.map(col => (
                <TableCell key={col.key}><Skeleton className="h-4 w-full" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(col => <TableHead key={col.key} className={col.className}>{col.header}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(item => (
          <TableRow key={keyExtractor(item)}>
            {columns.map(col => (
              <TableCell key={col.key} className={col.className}>{col.render(item)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
