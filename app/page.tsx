"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  uploadExcelToJson,
  fetchLinkedInLeadsMaster,
  type LinkedInLeadMaster,
} from "@/lib/api";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function Home() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    data: leads = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["linkedin-leads-master"],
    queryFn: fetchLinkedInLeadsMaster,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadExcelToJson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedin-leads-master"] });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file ?? null);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          LinkedIn Leads
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Upload Excel</CardTitle>
            <CardDescription>
              Upload an Excel file to convert to JSON. Accepted: .xlsx, .xls
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="grid w-full max-w-sm gap-2">
              <Label htmlFor="excel-file">File</Label>
              <Input
                id="excel-file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading…" : "Upload"}
            </Button>
          </CardContent>
          {uploadMutation.isError && (
            <CardContent className="pt-0">
              <p className="text-sm text-destructive">
                {uploadMutation.error.message}
              </p>
            </CardContent>
          )}
          {uploadMutation.isSuccess && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">Upload complete.</p>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads master</CardTitle>
            <CardDescription>
              All uploaded files and row counts from linkedin-leads-master
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="text-sm text-destructive">{error.message}</p>
            )}
            {isPending && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {!isPending && !error && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Created at</TableHead>
                    <TableHead>File name</TableHead>
                    <TableHead className="text-right">Total rows</TableHead>
                    <TableHead className="min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No records yet. Upload an Excel file above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (leads as LinkedInLeadMaster[]).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{formatDate(row.created_at)}</TableCell>
                        <TableCell>{row.file_name}</TableCell>
                        <TableCell className="text-right">
                          {row.total_rows}
                        </TableCell>
                        <TableCell className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/excel-data/${row.id}`}>
                              View rows
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/query/${row.id}`}>
                              Add query
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
