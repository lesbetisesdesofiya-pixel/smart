<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_can_login(): void
    {
        DB::table('users')->insert([
            'name' => 'Super Admin',
            'email' => 'superadmin@test.com',
            'password' => bcrypt('password'),
            'role' => 'superadmin',
            'active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/superadmin/login', [
            'email' => 'superadmin@test.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_superadmin_login_fails_with_wrong_password(): void
    {
        DB::table('users')->insert([
            'name' => 'Super Admin',
            'email' => 'superadmin2@test.com',
            'password' => bcrypt('password'),
            'role' => 'superadmin',
            'active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/superadmin/login', [
            'email' => 'superadmin2@test.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_login(): void
    {
        DB::table('users')->insert([
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/admin/login', [
            'email' => 'admin@test.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user', 'schools']);
    }

    public function test_inactive_admin_cannot_login(): void
    {
        DB::table('users')->insert([
            'name' => 'Inactive Admin',
            'email' => 'inactive@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'active' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/admin/login', [
            'email' => 'inactive@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(403);
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/auth/logout');

        $response->assertOk();
    }

    public function test_refresh_token_works(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/auth/refresh');

        $response->assertOk()
            ->assertJson(['success' => true]);
    }
}
