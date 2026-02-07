"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  fetchQueryResults,
  fetchQueryResultsData,
  postQueryData,
  type QueryResultDataRow,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Normalize API value that may be string or Excel-style { text, hyperlink } to a display string */
function cellValue(
  value: string | { text?: string; hyperlink?: string } | null | undefined
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "text" in value) return value.text ?? "";
  return "";
}

export default function QueryPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const queryClient = useQueryClient();
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [queryText, setQueryText] = useState("");

  const { data: queries = [], isPending: queriesLoading } = useQuery({
    queryKey: ["query-results", id],
    queryFn: () => fetchQueryResults(Number(id)),
  });

  const addQueryMutation = useMutation({
    mutationFn: ({
      excelMasterId,
      query_text,
    }: {
      excelMasterId: number;
      query_text: string;
    }) => postQueryData(excelMasterId, query_text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["query-results", id] });
      setModalOpen(false);
      setQueryText("");
    },
  });

  const { data: rows = [], isPending: dataLoading } = useQuery({
    queryKey: ["query-results-data", selectedQuery ?? ""],
    queryFn: () => fetchQueryResultsData(selectedQuery!),
    enabled: !!selectedQuery,
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">← Back</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Query results (ID: {id || "—"})
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle>Queries</CardTitle>
              <CardDescription>
                Select a query to view matching data
              </CardDescription>
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={() => setModalOpen(true)}
              >
                Add query
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {queriesLoading && (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
              {!queriesLoading && queries.length === 0 && (
                <p className="text-sm text-muted-foreground">No queries.</p>
              )}
              {!queriesLoading &&
                queries.map((item) => (
                  <Button
                    key={item.query}
                    variant={
                      selectedQuery === item.query ? "default" : "outline"
                    }
                    size="sm"
                    className="h-auto w-full justify-start whitespace-normal py-2 text-left"
                    onClick={() => setSelectedQuery(item.query)}
                  >
                    <span className="line-clamp-3">{item.query}</span>
                  </Button>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {selectedQuery
                  ? `Data for: "${selectedQuery}"`
                  : "Select a query from the left"}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              {!selectedQuery && (
                <p className="text-sm text-muted-foreground">
                  Choose a query to load results.
                </p>
              )}
              {selectedQuery && dataLoading && (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
              {selectedQuery && !dataLoading && (
                <div className="overflow-x-auto rounded-md border">
                  <Table className="min-w-[800px] w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14 shrink-0">ID</TableHead>
                        <TableHead className="w-16 shrink-0">Indian</TableHead>
                        <TableHead className="w-[140px] shrink-0">Profile URL</TableHead>
                        <TableHead className="w-[140px] shrink-0">Full name</TableHead>
                        <TableHead className="w-[140px] shrink-0">Company</TableHead>
                        <TableHead className="w-[180px] shrink-0">Title</TableHead>
                        <TableHead className="w-[160px] shrink-0">Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground"
                          >
                            No rows.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row: QueryResultDataRow) => {
                          const rawProfile = row.rows_data?.defaultProfileUrl;
                          const profileDisplay = cellValue(rawProfile);
                          const profileHref =
                            typeof rawProfile === "object" &&
                            rawProfile &&
                            "hyperlink" in rawProfile &&
                            typeof (rawProfile as { hyperlink?: string }).hyperlink === "string"
                              ? (rawProfile as { hyperlink: string }).hyperlink
                              : profileDisplay;
                          return (
                            <TableRow key={row.id}>
                              <TableCell className="w-14 shrink-0">{row.id}</TableCell>
                              <TableCell className="w-16 shrink-0">{cellValue(row.indian)}</TableCell>
                              <TableCell className="min-w-0 w-[140px] max-w-[140px] overflow-hidden">
                                {profileDisplay ? (
                                  <a
                                    href={profileHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary block min-w-0 truncate underline underline-offset-4 hover:no-underline"
                                    title={profileDisplay}
                                  >
                                    {profileDisplay}
                                  </a>
                                ) : (
                                  ""
                                )}
                              </TableCell>
                              <TableCell className="min-w-0 max-w-[140px] overflow-hidden" title={cellValue(row.rows_data?.fullName) || undefined}>
                                <span className="block truncate">{cellValue(row.rows_data?.fullName) || "-"}</span>
                              </TableCell>
                              <TableCell className="min-w-0 max-w-[140px] overflow-hidden" title={cellValue(row.rows_data?.companyName) || undefined}>
                                <span className="block truncate">{cellValue(row.rows_data?.companyName) || "-"}</span>
                              </TableCell>
                              <TableCell className="min-w-0 max-w-[180px] overflow-hidden" title={cellValue(row.rows_data?.title) || undefined}>
                                <span className="block truncate">{cellValue(row.rows_data?.title) || "-"}</span>
                              </TableCell>
                              <TableCell className="min-w-0 max-w-[160px] overflow-hidden" title={cellValue(row.rows_data?.location) || undefined}>
                                <span className="block truncate">{cellValue(row.rows_data?.location) || "-"}</span>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add query</DialogTitle>
            <DialogDescription>
              Enter the query text. It will be saved for this excel master (ID:{" "}
              {id}).
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = queryText.trim();
              if (!text || !id || Number.isNaN(Number(id))) return;
              addQueryMutation.mutate({
                excelMasterId: Number(id),
                query_text: text,
              });
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="query-text">Query</Label>
              <Textarea
                id="query-text"
                placeholder="Enter prompt"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                disabled={addQueryMutation.isPending}
                rows={8}
                className="resize-none"
              />
            </div>
            {addQueryMutation.isError && (
              <p className="text-sm text-destructive">
                {addQueryMutation.error.message}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={addQueryMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!queryText.trim() || addQueryMutation.isPending}
              >
                {addQueryMutation.isPending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
