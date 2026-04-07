<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\LegalCase;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentWebController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return $request->user()->current_workspace_id;
    }

    public function index(Request $request)
    {
        $wsId  = $this->workspaceId($request);
        $query = Document::where('workspace_id', $wsId)
            ->with(['legalCase:id,title,uuid', 'client:id,name,company_name,type', 'uploadedBy:id,name']);

        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%");
        }
        if ($caseId = $request->get('case_id')) {
            $query->where('case_id', $caseId);
        }
        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        $documents = $query->latest()->paginate(20)->withQueryString();
        $cases     = LegalCase::where('workspace_id', $wsId)->orderBy('title')->get(['id', 'title']);

        return Inertia::render('Documents/Index', [
            'documents' => $documents,
            'cases'     => $cases,
            'filters'   => $request->only(['search', 'case_id', 'category']),
        ]);
    }

    public function store(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $request->validate([
            'file'     => 'required|file|max:51200', // 50MB
            'name'     => 'nullable|string|max:255',
            'case_id'  => 'nullable|exists:cases,id',
            'client_id'=> 'nullable|exists:clients,id',
            'category' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $path = $file->store("workspaces/{$wsId}/documents", 'private');

        Document::create([
            'uuid'          => Str::uuid(),
            'workspace_id'  => $wsId,
            'case_id'       => $request->case_id,
            'client_id'     => $request->client_id,
            'uploaded_by'   => $request->user()->id,
            'name'          => $request->name ?: $file->getClientOriginalName(),
            'original_name' => $file->getClientOriginalName(),
            'mime_type'     => $file->getMimeType(),
            'size_bytes'    => $file->getSize(),
            'storage_path'  => $path,
            'storage_disk'  => 'private',
            'category'      => $request->category ?? 'outros',
            'description'   => $request->description,
        ]);

        return redirect()->route('documents.index')
            ->with('success', 'Documento enviado com sucesso!');
    }

    public function destroy(Request $request, int $id)
    {
        $wsId     = $this->workspaceId($request);
        $document = Document::where('workspace_id', $wsId)->findOrFail($id);

        Storage::disk('private')->delete($document->storage_path);
        $document->delete();

        return redirect()->route('documents.index')
            ->with('success', 'Documento removido!');
    }
}
