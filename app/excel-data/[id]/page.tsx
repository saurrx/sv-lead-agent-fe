"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { fetchExcelRows, type ExcelRow } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 100;

function matchesSearch(row: ExcelRow, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.trim().toLowerCase();
  const id = String(row.id).toLowerCase();
  const indian = (row.indian ?? "").toLowerCase();
  const profileUrl = (row.rows_data?.defaultProfileUrl?.text ?? "").toLowerCase();
  const fullName = (row.rows_data?.fullName ?? "").toLowerCase();
  return (
    id.includes(lower) ||
    indian.includes(lower) ||
    profileUrl.includes(lower) ||
    fullName.includes(lower)
  );
}

export default function ExcelDataPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const [indianFilter, setIndianFilter] = useState<string>("all");

  const {
    data: rows = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["excel-rows", id],
    queryFn: () => fetchExcelRows(Number(id)),
    enabled: !!id && !Number.isNaN(Number(id)),
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchesSearch(row, searchQuery)) return false;
      if (indianFilter === "all") return true;
      const indian = (row.indian ?? "").toLowerCase();
      if (indianFilter === "yes") return indian === "yes";
      if (indianFilter === "no") return indian !== "yes";
      return true;
    });
  }, [rows, searchQuery, indianFilter]);

  const visibleRows = filteredRows.slice(0, visibleCount);
  const hasMore = visibleCount < filteredRows.length;

  const loadMore = () => {
    setVisibleCount((c) => c + PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">← Back</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Excel data (ID: {id || "—"})
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rows</CardTitle>
            <CardDescription>
              Showing {visibleRows.length} of {filteredRows.length} rows (of{" "}
              {rows.length} total). Id, Indian, Profile URL, Full name.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPending && !error && rows.length > 0 && (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    type="search"
                    placeholder="Search by ID, Indian, Profile URL, Full name…"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                  />
                </div>
                <div className="grid w-full gap-2 sm:w-[180px]">
                  <Label>Is Indian</Label>
                  <Select
                    value={indianFilter}
                    onValueChange={(v) => {
                      setIndianFilter(v);
                      setVisibleCount(PAGE_SIZE);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">{error.message}</p>
            )}
            {isPending && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {!isPending && !error && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Indian</TableHead>
                      <TableHead>Profile URL</TableHead>
                      <TableHead>Full name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground"
                        >
                          No rows.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleRows.map((row: ExcelRow) => {
                        const profileUrl =
                          row.rows_data?.defaultProfileUrl?.text ?? "";
                        return (
                          <TableRow key={row.id}>
                            <TableCell>{row.id}</TableCell>
                            <TableCell>{row.indian ?? "-"}</TableCell>
                            <TableCell>
                              {profileUrl ? (
                                <a
                                  href={profileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline underline-offset-4 hover:no-underline"
                                >
                                  {profileUrl}
                                </a>
                              ) : (
                                ""
                              )}
                            </TableCell>
                            <TableCell>
                              {row.rows_data?.fullName ?? ""}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                {hasMore && (
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="w-full sm:w-auto"
                  >
                    Load more
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
