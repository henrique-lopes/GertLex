<?php
// ══════════════════════════════════════════════════════════════
// app/Http/Controllers/Api/AuthController.php
// ══════════════════════════════════════════════════════════════
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // POST /api/auth/register
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => 'required|email|unique:users,email',
            'password'         => 'required|string|min:8|confirmed',
            'workspace_name'   => 'required|string|max:255',
            'oab_number'       => 'nullable|string|max:20',
            'oab_state'        => 'nullable|string|size:2',
            'phone'            => 'nullable|string|max:20',
        ]);

        // Cria o usuário
        $user = User::create([
            'uuid'       => Str::uuid(),
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => Hash::make($data['password']),
            'oab_number' => $data['oab_number'] ?? null,
            'oab_state'  => $data['oab_state'] ?? null,
            'phone'      => $data['phone'] ?? null,
        ]);

        // Cria o workspace (escritório)
        $workspace = Workspace::create([
            'uuid'        => Str::uuid(),
            'name'        => $data['workspace_name'],
            'slug'        => Str::slug($data['workspace_name']) . '-' . Str::random(4),
            'email'       => $data['email'],
            'plan'        => 'solo',
            'plan_status' => 'trialing',
            'trial_ends_at' => now()->addDays(14),
            'max_lawyers' => 1,
            'max_cases'   => 50,
            'has_ai'      => false,
        ]);

        // Vincula usuário ao workspace como owner
        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id'      => $user->id,
            'role'         => 'owner',
            'is_active'    => true,
            'joined_at'    => now(),
        ]);

        $user->update(['current_workspace_id' => $workspace->id]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'      => $user->load('currentWorkspace'),
            'workspace' => $workspace,
            'token'     => $token,
            'message'   => 'Conta criada com sucesso! Trial de 14 dias ativo.',
        ], 201);
    }

    // POST /api/auth/login
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($data)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'      => $user->load('currentWorkspace'),
            'token'     => $token,
        ]);
    }

    // POST /api/auth/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout realizado com sucesso.']);
    }

    // GET /api/auth/me
    public function me(Request $request)
    {
        return response()->json($request->user()->load('currentWorkspace'));
    }
}
