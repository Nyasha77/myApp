import { useEffect, useState, useCallback } from 'react';
import { Plus, Shapes } from 'lucide-react';
import * as categoryApi from '../api/categories';
import * as progressionApi from '../api/progression';
import CategoryCard from '../components/CategoryCard';
import CategoryForm from '../components/CategoryForm';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCategory, setModalCategory] = useState(undefined);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    const [cats, prog] = await Promise.all([categoryApi.getCategories(), progressionApi.getProgression()]);
    setCategories(cats);
    setStreaks(prog.streaks);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (modalCategory?.id) {
        await categoryApi.updateCategory(modalCategory.id, data);
      } else {
        await categoryApi.createCategory(data);
      }
      setModalCategory(undefined);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    try {
      await categoryApi.deleteCategory(category.id);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete category');
    }
  };

  const streakFor = (categoryId) => streaks.find((s) => s.category_id === categoryId)?.current_streak || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-50">Categories</h1>
        <button type="button" onClick={() => setModalCategory(null)} className="btn-primary !min-h-[40px] !py-2 !px-3">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Shapes}
          title="No categories yet."
          subtitle="Create one to organize your quests and grow specific stats."
          action={<button type="button" onClick={() => setModalCategory(null)} className="btn-primary"><Plus className="w-4 h-4" /> New category</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} streak={streakFor(c.id)} onEdit={setModalCategory} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Modal open={modalCategory !== undefined} onClose={() => setModalCategory(undefined)} title={modalCategory?.id ? 'Edit category' : 'New category'}>
        <CategoryForm initialCategory={modalCategory} onSubmit={handleSubmit} onCancel={() => setModalCategory(undefined)} submitting={submitting} />
      </Modal>
    </div>
  );
}
