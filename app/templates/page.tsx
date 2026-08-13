'use client';

import { useState, useEffect } from 'react';

/**
 * /app/templates
 * Email templates management
 * TODO: List templates with variants
 * TODO: Create/edit template form
 * TODO: Template preview with sample data
 * TODO: Follow-up sequence visualization
 * TODO: Performance metrics (reply rate per template)
 */
export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      // TODO: Create /api/templates endpoint
      setTemplates([]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading templates...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Email Templates</h1>

      {/* TODO: Template list/table with shadcn Table component */}
      {/* TODO: Create template button and modal */}

      {templates.length === 0 ? (
        <p className="text-gray-500">No templates yet. Create your first one!</p>
      ) : (
        <div>{/* Template list goes here */}</div>
      )}
    </div>
  );
}
