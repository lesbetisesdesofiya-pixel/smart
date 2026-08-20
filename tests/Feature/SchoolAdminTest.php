<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolAdminTest extends TestCase
{
    use RefreshDatabase;

    private string $token;
    private int $schoolId;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $school = School::factory()->create();
        $user->schools()->attach($school->id);

        $this->schoolId = $school->id;
        $this->token = $user->createToken('admin-token')->plainTextToken;
    }

    private function adminRequest(string $method, string $url): \Illuminate\Testing\TestResponse
    {
        return $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->withHeader('X-School-Id', (string) $this->schoolId)
            ->$method($url);
    }

    public function test_admin_can_list_classes(): void
    {
        $this->adminRequest('getJson', '/api/v1/school-admin/classes')
            ->assertOk();
    }

    public function test_admin_can_list_matieres(): void
    {
        $this->adminRequest('getJson', '/api/v1/school-admin/matieres')
            ->assertOk();
    }

    public function test_admin_can_list_profs(): void
    {
        $this->adminRequest('getJson', '/api/v1/school-admin/profs')
            ->assertOk();
    }

    public function test_admin_can_list_eleves(): void
    {
        $this->adminRequest('getJson', '/api/v1/school-admin/eleves')
            ->assertOk();
    }

    public function test_admin_can_list_evaluations(): void
    {
        $this->adminRequest('getJson', '/api/v1/school-admin/evaluations')
            ->assertOk();
    }

    public function test_admin_can_list_subscriptions(): void
    {
        $this->adminRequest('getJson', '/api/v1/school-admin/subscriptions')
            ->assertOk();
    }

    public function test_admin_can_list_annonces(): void
    {
        $this->adminRequest('getJson', '/api/v1/school-admin/annonces')
            ->assertOk();
    }

    public function test_unauthenticated_cannot_access_admin_routes(): void
    {
        $this->getJson('/api/v1/school-admin/classes')
            ->assertStatus(401);
    }
}
