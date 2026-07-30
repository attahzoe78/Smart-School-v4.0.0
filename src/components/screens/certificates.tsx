"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Award, FileText, IdCard, Search, Download, Printer, User, Calendar,
  Phone, MapPin, Droplet, GraduationCap, ShieldCheck, Stamp,
} from "lucide-react";
import { formatDate, getInitials, getFullName } from "@/lib/format";

type TabValue = "certificates" | "id-cards" | "generated";

const TABS: { value: TabValue; label: string; icon: typeof Award }[] = [
  { value: "certificates", label: "Certificates", icon: FileText },
  { value: "id-cards", label: "ID Cards", icon: IdCard },
  { value: "generated", label: "Generated", icon: Award },
];

const CERT_TYPES = [
  { value: "Transfer", label: "Transfer Certificate" },
  { value: "Character", label: "Character Certificate" },
  { value: "Bonafide", label: "Bonafide Certificate" },
  { value: "Completion", label: "Completion Certificate" },
];

export function CertificatesScreen() {
  const [activeTab, setActiveTab] = useState<TabValue>("certificates");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates & ID Cards"
        description="Generate official school certificates and student ID cards"
        icon={<Award className="h-5 w-5" />}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-full sm:w-auto flex justify-start">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                <t.icon className="h-4 w-4" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="certificates" className="mt-4">
          <CertificatesPanel />
        </TabsContent>
        <TabsContent value="id-cards" className="mt-4">
          <IdCardsPanel />
        </TabsContent>
        <TabsContent value="generated" className="mt-4">
          <GeneratedPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* Student Search Component                                        */
/* -------------------------------------------------------------- */

function useStudentSearch() {
  const [search, setSearch] = useState("");
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students", "search", search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      return api(`/api/students?${params.toString()}`);
    },
  });
  return { search, setSearch, students, isLoading };
}

function StudentSearch({ students, search, setSearch, selectedId, onSelect }: any) {
  const [open, setOpen] = useState(false);
  const selected = students.find((s: any) => s.id === selectedId);

  return (
    <div className="space-y-2">
      <Label>Find Student</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name or admission no..."
          className="pl-9"
        />
      </div>
      {open && search && (
        <div className="border rounded-md bg-card shadow-sm max-h-64 overflow-y-auto">
          {students.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground text-center">No students found</p>
          ) : (
            students.slice(0, 10).map((s: any) => (
              <button
                key={s.id}
                onClick={() => { onSelect(s.id); setOpen(false); }}
                className="w-full flex items-center gap-3 p-2 hover:bg-muted/50 text-left border-b last:border-0"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={s.photo || undefined} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{getInitials(s.firstName, s.lastName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getFullName(s)}</p>
                  <p className="text-xs text-muted-foreground">{s.admissionNo} • {s.currentClass?.name || "—"}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
      {selected && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-emerald-50/50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={selected.photo || undefined} />
            <AvatarFallback className="bg-emerald-600 text-white">{getInitials(selected.firstName, selected.lastName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{getFullName(selected)}</p>
            <p className="text-xs text-muted-foreground">{selected.admissionNo} • {selected.currentClass?.name} {selected.section?.name || ""}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onSelect("")}>Change</Button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */
/* School Header (for certificate & ID)                            */
/* -------------------------------------------------------------- */

function SchoolHeader() {
  return (
    <div className="text-center border-b-2 border-emerald-700 pb-3 mb-4">
      <div className="flex items-center justify-center gap-3">
        <div className="h-12 w-12 rounded-full bg-emerald-700 text-white flex items-center justify-center text-lg font-bold">
          S
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Smart School International</h2>
          <p className="text-xs text-muted-foreground">Knowledge • Discipline • Excellence</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">123 Education Road, Jos, Plateau State, Nigeria • +234 803 000 0000</p>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* Certificates Panel                                              */
/* -------------------------------------------------------------- */

function CertificatesPanel() {
  const { search, setSearch, students } = useStudentSearch();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [certType, setCertType] = useState("Bonafide");
  const [generated, setGenerated] = useState<any>(null);

  const { data: templatesData } = useQuery({
    queryKey: ["certificates", "templates"],
    queryFn: () => api("/api/certificates?action=templates"),
  });

  const templates = templatesData?.certificates || [];
  const selectedTemplate = templates.find((t: any) => t.type === certType) || templates[0];

  const student = students.find((s: any) => s.id === selectedStudentId);

  const generateMutation = useMutation({
    mutationFn: () => api("/api/certificates", {
      method: "POST",
      body: JSON.stringify({
        action: "generate",
        studentId: selectedStudentId,
        templateId: selectedTemplate?.id,
        type: certType,
        generatedBy: "Admin",
      }),
    }),
    onSuccess: (data) => {
      setGenerated(data);
      toast.success(`Certificate generated — No: ${data.certificateNo}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleGenerate = () => {
    if (!selectedStudentId) { toast.error("Please select a student first"); return; }
    generateMutation.mutate();
  };

  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left - Controls */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" /> Certificate Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Certificate Type</Label>
            <Select value={certType} onValueChange={(v) => { setCertType(v); setGenerated(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CERT_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <StudentSearch
            students={students}
            search={search}
            setSearch={setSearch}
            selectedId={selectedStudentId}
            onSelect={(id: string) => { setSelectedStudentId(id); setGenerated(null); }}
          />

          {student && (
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Student Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Info label="Admission No" value={student.admissionNo} />
                <Info label="Class" value={`${student.currentClass?.name || "—"}`} />
                <Info label="Gender" value={student.gender} />
                <Info label="Date of Birth" value={formatDate(student.dateOfBirth)} />
                <Info label="Admission Date" value={formatDate(student.admissionDate)} />
                <Info label="Blood Group" value={student.bloodGroup || "—"} />
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedStudentId || generateMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Stamp className="h-4 w-4" />
            {generateMutation.isPending ? "Generating..." : "Generate Certificate"}
          </Button>

          {generated && (
            <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200">
              <p className="text-xs font-semibold text-emerald-700">Generated Successfully</p>
              <p className="text-xs text-muted-foreground mt-1">Certificate No: <span className="font-mono font-medium">{generated.certificateNo}</span></p>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5" /> Print Certificate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right - Preview */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Live Preview</CardTitle>
          <Badge variant="secondary" className="text-xs">{certType} Certificate</Badge>
        </CardHeader>
        <CardContent>
          {student ? (
            <div className="bg-white border-2 border-emerald-100 rounded-lg p-6 shadow-inner">
              <SchoolHeader />
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{certType} Certificate</p>
                <h3 className="text-2xl font-bold mt-2 text-emerald-800">
                  {certType === "Transfer" ? "Transfer Certificate" :
                   certType === "Character" ? "Certificate of Character" :
                   certType === "Bonafide" ? "Bonafide Certificate" :
                   "Certificate of Completion"}
                </h3>
                <div className="h-0.5 w-24 bg-emerald-600 mx-auto mt-2" />
              </div>

              <div className="px-2 sm:px-6 space-y-3 text-sm leading-relaxed">
                <p>
                  This is to certify that <span className="font-bold text-emerald-700">{getFullName(student)}</span>,
                  bearing admission number <span className="font-mono font-medium">{student.admissionNo}</span>,
                  {certType === "Bonafide" && <> is a bonafide student of this institution, currently in</>}
                  {certType === "Character" && <> has been a student of this institution from {formatDate(student.admissionDate)} to date, and has shown</>}
                  {certType === "Transfer" && <> was a student of this institution and is hereby transferred with effect from</>}
                  {certType === "Completion" && <> has successfully completed the requirements of</>}
                  {" "}<span className="font-medium">Class {student.currentClass?.name || "—"}</span>
                  {student.section?.name && <span> (Section {student.section.name})</span>}.
                </p>

                {certType === "Character" && (
                  <p>
                    During the period of study, the student has demonstrated excellent conduct, discipline and moral uprightness. To the best of our knowledge, the character is <span className="font-medium">Very Good</span>.
                  </p>
                )}

                {certType === "Completion" && (
                  <p>
                    Having fulfilled all academic and behavioural requirements set forth by the school for the {student.currentClass?.name || ""} level, this certificate is issued as a testimony thereof.
                  </p>
                )}

                {certType === "Transfer" && (
                  <p>
                    The student's date of birth as recorded in the admission register is <span className="font-medium">{formatDate(student.dateOfBirth)}</span>. This transfer is being issued at the request of the parent/guardian.
                  </p>
                )}

                {certType === "Bonafide" && (
                  <p>
                    This certificate is issued on request for official purposes. The student's date of birth as per school records is <span className="font-medium">{formatDate(student.dateOfBirth)}</span>.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
                  <div className="space-y-1 text-xs">
                    <Info label="Date of Birth" value={formatDate(student.dateOfBirth)} />
                    <Info label="Admission Date" value={formatDate(student.admissionDate)} />
                    <Info label="Gender" value={student.gender || "—"} />
                    {student.parent && <Info label="Parent/Guardian" value={getFullName(student.parent)} />}
                  </div>
                  <div className="space-y-3 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Issue</p>
                      <p className="text-sm font-medium">{today}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Certificate No</p>
                      <p className="text-sm font-mono font-medium">{generated?.certificateNo || "—"}</p>
                    </div>
                    <div className="pt-4">
                      <p className="text-sm italic text-muted-foreground border-t border-dashed pt-1 inline-block px-4">Principal's Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Select a student"
              description="Search and select a student to preview the certificate"
              icon={<FileText className="h-7 w-7" />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* ID Cards Panel                                                  */
/* -------------------------------------------------------------- */

function IdCardsPanel() {
  const { search, setSearch, students } = useStudentSearch();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [generated, setGenerated] = useState<any>(null);

  const { data: templatesData } = useQuery({
    queryKey: ["certificates", "templates"],
    queryFn: () => api("/api/certificates?action=templates"),
  });

  const templates = templatesData?.idCards || [];
  const selectedTemplate = templates[0];

  const student = students.find((s: any) => s.id === selectedStudentId);

  const generateMutation = useMutation({
    mutationFn: () => api("/api/certificates", {
      method: "POST",
      body: JSON.stringify({
        action: "generate",
        studentId: selectedStudentId,
        templateId: selectedTemplate?.id,
        type: "id-card",
        generatedBy: "Admin",
      }),
    }),
    onSuccess: (data) => {
      setGenerated(data);
      toast.success(`ID Card generated — No: ${data.certNo}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleGenerate = () => {
    if (!selectedStudentId) { toast.error("Please select a student first"); return; }
    generateMutation.mutate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Controls */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <IdCard className="h-4 w-4 text-emerald-600" /> ID Card Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StudentSearch
            students={students}
            search={search}
            setSearch={setSearch}
            selectedId={selectedStudentId}
            onSelect={(id: string) => { setSelectedStudentId(id); setGenerated(null); }}
          />

          {student && (
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Student Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Info label="Admission No" value={student.admissionNo} />
                <Info label="Class" value={`${student.currentClass?.name || "—"}`} />
                <Info label="Blood Group" value={student.bloodGroup || "—"} />
                <Info label="Date of Birth" value={formatDate(student.dateOfBirth)} />
                <Info label="Phone" value={student.phone || "—"} />
                <Info label="Address" value={student.city || "—"} />
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedStudentId || generateMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" />
            {generateMutation.isPending ? "Generating..." : "Generate ID Card"}
          </Button>

          {generated && (
            <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200">
              <p className="text-xs font-semibold text-emerald-700">ID Card Ready</p>
              <p className="text-xs text-muted-foreground mt-1">ID No: <span className="font-mono font-medium">{generated.certNo}</span></p>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5" /> Print ID Card
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview - Front and Back */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">ID Card Preview</CardTitle>
          <Badge variant="secondary" className="text-xs">Front & Back</Badge>
        </CardHeader>
        <CardContent>
          {student ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Front */}
              <div className="bg-white border-2 border-emerald-100 rounded-lg overflow-hidden shadow-md">
                <div className="bg-emerald-700 text-white p-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-white text-emerald-700 flex items-center justify-center text-sm font-bold">S</div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Smart School Int'l</p>
                    <p className="text-[10px] opacity-80 leading-tight">Student Identity Card</p>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-20 w-20 rounded-md border-2 border-emerald-100">
                      <AvatarImage src={student.photo || undefined} className="object-cover" />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg rounded-md">{getInitials(student.firstName, student.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-bold truncate">{getFullName(student)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Student</p>
                      <div className="space-y-0.5 text-[11px]">
                        <p><span className="text-muted-foreground">ID:</span> <span className="font-mono">{generated?.certNo || student.admissionNo}</span></p>
                        <p><span className="text-muted-foreground">Adm No:</span> <span className="font-mono">{student.admissionNo}</span></p>
                        <p><span className="text-muted-foreground">Class:</span> <span className="font-medium">{student.currentClass?.name}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-3 text-[10px]">
                    <MiniInfo icon={Droplet} label="Blood" value={student.bloodGroup || "—"} />
                    <MiniInfo icon={User} label="Gender" value={student.gender || "—"} />
                    <MiniInfo icon={Calendar} label="DOB" value={formatDate(student.dateOfBirth)} />
                    <MiniInfo icon={Phone} label="Phone" value={student.phone || "—"} />
                  </div>
                  <p className="text-[9px] text-center text-muted-foreground mt-2 border-t pt-1">If found, please return to the school address below.</p>
                </div>
              </div>

              {/* Back */}
              <div className="bg-white border-2 border-emerald-100 rounded-lg overflow-hidden shadow-md flex flex-col">
                <div className="bg-emerald-50 p-3 border-b border-emerald-100">
                  <p className="text-xs font-bold text-emerald-800">Parent / Guardian Information</p>
                </div>
                <div className="p-3 flex-1 space-y-2">
                  {student.parent ? (
                    <>
                      <BackInfo icon={User} label="Name" value={getFullName(student.parent)} />
                      <BackInfo icon={User} label="Relation" value={student.parent.relation || "—"} />
                      <BackInfo icon={Phone} label="Phone" value={student.parent.phone || "—"} />
                      <BackInfo icon={MapPin} label="Address" value={`${student.address || ""} ${student.city || ""}`.trim() || "—"} />
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No parent/guardian on record</p>
                  )}

                  <div className="border-t pt-2 mt-2">
                    <p className="text-[10px] font-semibold text-emerald-700">School Address</p>
                    <p className="text-[10px] text-muted-foreground">123 Education Road, Jos, Plateau State</p>
                    <p className="text-[10px] text-muted-foreground">Tel: +234 803 000 0000</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-1 border-t">
                    <div>
                      <p className="text-[9px] text-muted-foreground">Authorized Signature</p>
                      <div className="h-6 w-16 border-b border-dashed mt-1" />
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-muted-foreground">Valid Until</p>
                      <p className="text-[10px] font-medium">{new Date(new Date().getFullYear() + 1, 6, 31).toLocaleDateString("en-GB")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Select a student"
              description="Search and select a student to preview the ID card"
              icon={<IdCard className="h-7 w-7" />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* Generated Panel                                                 */
/* -------------------------------------------------------------- */

function GeneratedPanel() {
  const [search, setSearch] = useState("");
  const { data: generated = [], isLoading } = useQuery({
    queryKey: ["certificates", "generated"],
    queryFn: () => api("/api/certificates?action=generated"),
  });

  const filtered = generated.filter((g: any) =>
    !search ||
    g.certificateNo?.toLowerCase().includes(search.toLowerCase()) ||
    (g.student && `${g.student.firstName} ${g.student.lastName}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Generated Certificates</h3>
            <p className="text-xs text-muted-foreground">{filtered.length} records</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by certificate no or student name..." className="pl-9" />
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading generated certificates...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No certificates generated yet"
            description="Generated certificates will appear here"
            icon={<Award className="h-7 w-7" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g: any) => (
                  <TableRow key={g.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-medium">{g.certificateNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                          {g.student ? getInitials(g.student.firstName, g.student.lastName) : "—"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {g.student ? `${g.student.firstName} ${g.student.lastName}` : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{g.student?.admissionNo || ""}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{g.templateId ? "Certificate" : "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(g.generatedDate)}</TableCell>
                    <TableCell className="text-sm">{g.generatedBy || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------- */
/* Small helpers                                                   */
/* -------------------------------------------------------------- */

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xs font-medium">{value}</p>
    </div>
  );
}

function MiniInfo({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-emerald-600 shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

function BackInfo({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
        <p className="text-[10px] font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
