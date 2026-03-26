import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { testAPI } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { toast } from "sonner";

export default function TestConfig() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    duration_minutes: 30,
    total_questions: 10,
    passing_marks: 4,
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const res = await testAPI.listConfigs();
      setConfigs(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load configs");
    }
  };

  const handleCreate = async () => {
    if (!form.name) {
      return toast.error("Name is required");
    }

    setLoading(true);
    try {
      await testAPI.createConfig({
        ...form,
        course_id: null,
      });

      toast.success("Test config created");
      setForm({
        name: "",
        duration_minutes: 30,
        total_questions: 10,
        passing_marks: 4,
      });

      loadConfigs();
    } catch (err) {
      toast.error("Failed to create config");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Test Configuration</h1>
          <p className="text-slate-500">
            Create and manage entrance test settings
          </p>
        </div>

        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Test Config</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Test Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <Label>Total Questions</Label>
              <Input
                type="number"
                value={form.total_questions}
                onChange={(e) =>
                  setForm({ ...form, total_questions: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <Label>Passing Marks</Label>
              <Input
                type="number"
                value={form.passing_marks}
                onChange={(e) =>
                  setForm({ ...form, passing_marks: Number(e.target.value) })
                }
              />
            </div>

            <div className="col-span-2">
              <Button onClick={handleCreate} disabled={loading}>
                Create Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Config List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Configs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {configs.map((cfg) => (
              <div
                key={cfg.id}
                className="p-4 border rounded-lg flex justify-between"
              >
                <div>
                  <p className="font-medium">{cfg.name}</p>
                  <p className="text-sm text-gray-500">
                    {cfg.total_questions} Questions • {cfg.duration_minutes} min
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
