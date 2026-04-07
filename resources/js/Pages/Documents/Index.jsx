import { useState, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/UI/Button';
import EmptyState from '@/Components/UI/EmptyState';
import { Upload, FolderOpen, FileText, Image, File, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

function formatBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}
function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
}
function FileIcon({ mime }) {
    if (!mime) return <File size={20} className="text-[#6B7491]" />;
    if (mime.startsWith('image/')) return <Image size={20} className="text-[#4A7CFF]" />;
    if (mime === 'application/pdf') return <FileText size={20} className="text-[#E05555]" />;
    return <File size={20} className="text-[#6B7491]" />;
}

const categories = [
    ['petition','Petição'],['contract','Contrato'],['evidence','Prova'],
    ['decision','Decisão'],['others','Outros'],
];

export default function DocumentsIndex({ documents, cases, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [caseId, setCaseId] = useState(filters?.case_id ?? '');
    const [category, setCategory] = useState(filters?.category ?? '');
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    function applyFilters(overrides = {}) {
        router.get('/documentos', {
            search:   overrides.search   ?? search,
            case_id:  overrides.case_id  ?? caseId,
            category: overrides.category ?? category,
        }, { preserveState: true, replace: true });
    }

    function handleFiles(files) {
        if (!files?.length) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', files[0]);
        if (caseId) formData.append('case_id', caseId);
        router.post('/documentos', formData, {
            forceFormData: true,
            onFinish: () => setUploading(false),
        });
    }

    function deleteDoc(id) {
        if (confirm('Remover este documento?')) {
            router.delete(`/documentos/${id}`);
        }
    }

    return (
        <AppLayout title="Documentos">
            <Head title="Documentos — LexFlow" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-[#E8EAF0]">Documentos</h1>
                    <p className="text-sm text-[#6B7491] mt-0.5">{documents?.total ?? 0} arquivos</p>
                </div>
                <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload size={16} /> {uploading ? 'Enviando...' : 'Enviar Arquivo'}
                </Button>
                <input ref={fileRef} type="file" className="hidden"
                    onChange={e => handleFiles(e.target.files)} />
            </div>

            {/* Drag & Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 cursor-pointer transition-colors
                    ${dragOver ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#1E2330] hover:border-[#C9A84C]/50'}`}
            >
                <Upload size={24} className={`mx-auto mb-2 ${dragOver ? 'text-[#C9A84C]' : 'text-[#6B7491]'}`} />
                <p className="text-sm text-[#6B7491]">
                    {dragOver ? 'Solte para enviar' : 'Arraste arquivos aqui ou clique para selecionar'}
                </p>
                <p className="text-xs text-[#6B7491] mt-1">Máximo 50MB por arquivo</p>
            </div>

            {/* Filters */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4 mb-6 flex flex-wrap gap-3">
                <div className="flex-1 min-w-48 flex items-center gap-2 bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2">
                    <Search size={14} className="text-[#6B7491]" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyFilters()}
                        placeholder="Buscar por nome..." className="flex-1 bg-transparent text-sm text-[#E8EAF0] outline-none placeholder-[#6B7491]" />
                </div>
                <select value={caseId} onChange={e => { setCaseId(e.target.value); applyFilters({ case_id: e.target.value }); }}
                    className="bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                    <option value="">Todos os processos</option>
                    {(cases ?? []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <select value={category} onChange={e => { setCategory(e.target.value); applyFilters({ category: e.target.value }); }}
                    className="bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                    <option value="">Todas as categorias</option>
                    {categories.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            </div>

            {/* Grid */}
            {(documents?.data ?? []).length === 0 ? (
                <EmptyState icon={FolderOpen} title="Nenhum documento encontrado"
                    description="Envie o primeiro arquivo arrastando aqui ou clicando em 'Enviar Arquivo'." />
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {documents.data.map(doc => (
                            <div key={doc.id} className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4 group relative">
                                <button
                                    onClick={() => deleteDoc(doc.id)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                                        text-[#6B7491] hover:text-[#E05555] bg-[#0D0F14] rounded-lg p-1"
                                >
                                    <Trash2 size={13} />
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-[#1A1E29] flex items-center justify-center mb-3">
                                    <FileIcon mime={doc.mime_type} />
                                </div>
                                <p className="text-sm font-medium text-[#E8EAF0] truncate mb-1" title={doc.name}>
                                    {doc.name}
                                </p>
                                <p className="text-xs text-[#6B7491]">{formatBytes(doc.size_bytes)}</p>
                                <p className="text-xs text-[#6B7491]">{formatDate(doc.created_at)}</p>
                                {doc.legal_case && (
                                    <Link href={`/processos/${doc.legal_case.uuid}`}
                                        className="text-xs text-[#C9A84C] hover:underline mt-1 block truncate">
                                        {doc.legal_case.title}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>

                    {documents.last_page > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-xs text-[#6B7491]">Mostrando {documents.from}–{documents.to} de {documents.total}</p>
                            <div className="flex items-center gap-2">
                                {documents.prev_page_url && <Link href={documents.prev_page_url} className="p-1.5 rounded-lg bg-[#13161E] border border-[#1E2330] text-[#6B7491] hover:text-[#E8EAF0]"><ChevronLeft size={16} /></Link>}
                                <span className="text-xs text-[#6B7491]">{documents.current_page} / {documents.last_page}</span>
                                {documents.next_page_url && <Link href={documents.next_page_url} className="p-1.5 rounded-lg bg-[#13161E] border border-[#1E2330] text-[#6B7491] hover:text-[#E8EAF0]"><ChevronRight size={16} /></Link>}
                            </div>
                        </div>
                    )}
                </>
            )}
        </AppLayout>
    );
}
