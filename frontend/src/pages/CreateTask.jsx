import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { tasksApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  PlusCircle,
  Trash2,
  Play,
  Save,
  ArrowLeft,
  Sparkles,
  Code2,
  Clock,
  Settings2,
  Layers,
  X,
  Loader2,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const CreateTask = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [schedulePreset, setSchedulePreset] = useState('MANUAL');
  const [customCron, setCustomCron] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [timeoutSeconds, setTimeoutSeconds] = useState(10);
  const [retryCount, setRetryCount] = useState(2);

  // Extraction Config
  const [itemContainerSelector, setItemContainerSelector] = useState('');
  const [fields, setFields] = useState([
    { name: 'title', selector: 'h3 a', attribute: 'title', type: 'TEXT' },
    { name: 'price', selector: '.price_color', attribute: 'text', type: 'TEXT' },
  ]);

  useEffect(() => {
    if (isEdit && id) {
      const fetchTask = async () => {
        try {
          setIsLoading(true);
          const res = await tasksApi.getTask(id);
          if (res.success && res.data) {
            const t = res.data;
            setName(t.name || '');
            setSourceUrl(t.sourceUrl || '');
            setStatus(t.status || 'ACTIVE');
            setTimeoutSeconds(t.timeoutSeconds || 10);
            setRetryCount(t.retryCount ?? 2);

            if (t.schedule === 'MANUAL' || t.schedule === '0 0 * * * *' || t.schedule === '0 0 12 * * *' || t.schedule === '0 0 * * 0') {
              setSchedulePreset(t.schedule);
            } else {
              setSchedulePreset('CUSTOM');
              setCustomCron(t.schedule || '');
            }

            if (t.extractionConfig) {
              setItemContainerSelector(t.extractionConfig.itemContainerSelector || '');
              setFields(t.extractionConfig.fields || []);
            }
          }
        } catch (err) {
          toast.error('Failed to load task details');
          navigate('/tasks');
        } finally {
          setIsLoading(false);
        }
      };
      fetchTask();
    }
  }, [isEdit, id]);

  const addField = () => {
    setFields([...fields, { name: '', selector: '', attribute: 'text', type: 'TEXT' }]);
  };

  const removeField = (index) => {
    if (fields.length <= 1) {
      toast.error('At least one extraction field is required');
      return;
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const applyTemplate = (type) => {
    if (type === 'books') {
      setName('Books Catalogue Scraper');
      setSourceUrl('https://books.toscrape.com/catalogue/category/books_1/index.html');
      setItemContainerSelector('article.product_pod');
      setFields([
        { name: 'title', selector: 'h3 a', attribute: 'title', type: 'TEXT' },
        { name: 'price', selector: '.price_color', attribute: 'text', type: 'TEXT' },
        { name: 'availability', selector: '.availability', attribute: 'text', type: 'TEXT' },
        { name: 'rating', selector: 'p.star-rating', attribute: 'class', type: 'TEXT' },
        { name: 'detailUrl', selector: 'h3 a', attribute: 'href', type: 'URL' },
        { name: 'thumbnailUrl', selector: '.image_container img', attribute: 'src', type: 'URL' }
      ]);
      toast.success('Loaded Books to Scrape template!');
    } else if (type === 'quotes') {
      setName('Quotes & Authors Scraper');
      setSourceUrl('https://quotes.toscrape.com/');
      setItemContainerSelector('div.quote');
      setFields([
        { name: 'quote', selector: 'span.text', attribute: 'text', type: 'TEXT' },
        { name: 'author', selector: 'small.author', attribute: 'text', type: 'TEXT' },
        { name: 'authorUrl', selector: 'span a', attribute: 'href', type: 'URL' },
        { name: 'tags', selector: 'div.tags a.tag', attribute: 'text', type: 'ARRAY' }
      ]);
      toast.success('Loaded Quotes to Scrape template!');
    }
  };

  const handleTestScrape = async () => {
    if (!sourceUrl.trim()) {
      toast.error('Please enter a target Source URL first');
      return;
    }

    const payload = {
      sourceUrl: sourceUrl.trim(),
      extractionConfig: {
        itemContainerSelector: itemContainerSelector.trim(),
        fields: fields.filter((f) => f.name.trim() && f.selector.trim()),
      },
      limit: 5,
      timeoutSeconds,
    };

    if (payload.extractionConfig.fields.length === 0) {
      toast.error('Please define at least one valid extraction field');
      return;
    }

    try {
      setIsTesting(true);
      setShowTestModal(true);
      setTestResult(null);

      const res = await tasksApi.testScrapeAdHoc(payload);
      if (res.success) {
        setTestResult(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test scrape execution failed');
      setTestResult({
        success: false,
        errorMessage: err.response?.data?.message || 'Connection timeout or invalid selectors',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !sourceUrl.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    const validFields = fields.filter((f) => f.name.trim() && f.selector.trim());
    if (validFields.length === 0) {
      toast.error('At least one extraction field with selector is required');
      return;
    }

    const finalSchedule = schedulePreset === 'CUSTOM' ? customCron.trim() : schedulePreset;

    const taskPayload = {
      name: name.trim(),
      sourceUrl: sourceUrl.trim(),
      schedule: finalSchedule || 'MANUAL',
      status,
      timeoutSeconds: Number(timeoutSeconds),
      retryCount: Number(retryCount),
      extractionConfig: {
        itemContainerSelector: itemContainerSelector.trim(),
        fields: validFields,
      },
    };

    try {
      setIsSaving(true);
      if (isEdit && id) {
        await tasksApi.updateTask(id, taskPayload);
        toast.success(`Task '${name}' updated successfully!`);
      } else {
        await tasksApi.createTask(taskPayload);
        toast.success(`Task '${name}' created successfully!`);
      }
      navigate('/tasks');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading task definition...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Back button & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/tasks"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {isEdit ? 'Edit Scraping Task' : 'Create New Scraping Task'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Define source URL, extraction rules, and execution schedule.
            </p>
          </div>
        </div>

        {/* Preset Templates Shortcut */}
        {!isEdit && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Templates:
            </span>
            <button
              type="button"
              onClick={() => applyTemplate('books')}
              className="py-1.5 px-3 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-xs font-semibold transition-all"
            >
              Books Store
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('quotes')}
              className="py-1.5 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-semibold transition-all"
            >
              Quotes Collector
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: General Settings */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider border-b border-slate-800/80 pb-3">
            <Layers className="w-4 h-4" />
            General Task Settings
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Task Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Task Name <span className="text-teal-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Products Catalogue Scraper"
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-4 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all"
              />
            </div>

            {/* Target URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Target Source URL <span className="text-teal-400">*</span>
              </label>
              <input
                type="url"
                required
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/products"
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-4 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
            {/* Schedule */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                Schedule Preset
              </label>
              <select
                value={schedulePreset}
                onChange={(e) => setSchedulePreset(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none"
              >
                <option value="MANUAL">Manual Trigger Only</option>
                <option value="0 */15 * * * *">Every 15 Minutes</option>
                <option value="0 0 * * * *">Hourly (0 * * * *)</option>
                <option value="0 0 12 * * *">Daily at 12:00 PM</option>
                <option value="0 0 0 * * 0">Weekly on Sunday</option>
                <option value="CUSTOM">Custom Cron Expression</option>
              </select>
            </div>

            {/* Custom Cron if selected */}
            {schedulePreset === 'CUSTOM' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="0 0 * * * *"
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 rounded-xl py-2.5 px-3 text-xs text-teal-300 font-mono outline-none"
                />
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>

            {/* Timeout & Retries */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Settings2 className="w-3.5 h-3.5 text-teal-400" />
                Timeout / Retries
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(e.target.value)}
                  title="Timeout in seconds"
                  placeholder="10s"
                  className="w-1/2 bg-slate-950/70 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none"
                />
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={retryCount}
                  onChange={(e) => setRetryCount(e.target.value)}
                  title="Max Retries"
                  placeholder="2 retries"
                  className="w-1/2 bg-slate-950/70 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Jsoup CSS Extraction Rules */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              CSS Selector Extraction Schema
            </div>
            <span className="text-[11px] text-slate-400">Jsoup Parser Rules</span>
          </div>

          {/* Item Container Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Item Container Selector <span className="text-slate-500 font-normal lowercase">(optional for multi-item collections)</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              If the target page contains multiple items (e.g. products, cards, rows), enter the wrapper selector (e.g. <code className="text-teal-400">article.product_pod</code> or <code className="text-teal-400">div.quote</code>). Leave blank for single-page entity extraction.
            </p>
            <input
              type="text"
              value={itemContainerSelector}
              onChange={(e) => setItemContainerSelector(e.target.value)}
              placeholder="e.g. article.product_pod, div.card, tr.data-row"
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-xs font-mono text-teal-300 placeholder-slate-600 outline-none transition-all"
            />
          </div>

          {/* Fields List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Target Data Fields ({fields.length})
              </label>
              <button
                type="button"
                onClick={addField}
                className="py-1.5 px-3 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  {/* Field Name */}
                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold mb-1 block">
                      Field Key
                    </label>
                    <input
                      type="text"
                      required
                      value={field.name}
                      onChange={(e) => updateField(idx, 'name', e.target.value)}
                      placeholder="e.g. title, price"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500/50"
                    />
                  </div>

                  {/* Selector */}
                  <div className="sm:col-span-4">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold mb-1 block">
                      CSS Selector
                    </label>
                    <input
                      type="text"
                      required
                      value={field.selector}
                      onChange={(e) => updateField(idx, 'selector', e.target.value)}
                      placeholder="e.g. h3 a, span.price"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs font-mono text-teal-300 placeholder-slate-600 outline-none focus:border-teal-500/50"
                    />
                  </div>

                  {/* Attribute */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold mb-1 block">
                      Attribute
                    </label>
                    <select
                      value={field.attribute}
                      onChange={(e) => updateField(idx, 'attribute', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="text">text</option>
                      <option value="href">href (URL)</option>
                      <option value="src">src (Image)</option>
                      <option value="title">title</option>
                      <option value="class">class</option>
                      <option value="html">inner HTML</option>
                    </select>
                  </div>

                  {/* Type */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold mb-1 block">
                      Data Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(idx, 'type', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="TEXT">TEXT</option>
                      <option value="NUMBER">NUMBER</option>
                      <option value="URL">URL</option>
                      <option value="ARRAY">ARRAY</option>
                    </select>
                  </div>

                  {/* Remove action */}
                  <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => removeField(idx)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          {/* Test Scrape Preview Trigger */}
          <button
            type="button"
            onClick={handleTestScrape}
            disabled={isTesting}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Test Scrape Preview</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/tasks"
              className="w-full sm:w-auto text-center py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? 'Update Task' : 'Save & Activate Task'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Test Scrape Modal / Drawer */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase">
                  <Code2 className="w-4 h-4" />
                  Live Extraction Test
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">
                  {sourceUrl || 'Target Web Page'}
                </h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {isTesting ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400">Fetching HTML and evaluating selectors...</p>
                </div>
              ) : testResult ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">HTTP Status</div>
                      <div className={`text-sm font-bold mt-0.5 ${testResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {testResult.success ? `${testResult.httpStatusCode || 200} OK` : 'FAILED'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Records Found</div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">
                        {testResult.totalItemsFound || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Duration</div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">
                        {testResult.durationMs || 0}ms
                      </div>
                    </div>
                  </div>

                  {testResult.errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                      {testResult.errorMessage}
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Live JSON Output ({testResult.previewItems?.length || 0} items previewed)</span>
                    </div>
                    <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-teal-300 overflow-x-auto max-h-72">
                      {JSON.stringify(testResult.previewItems, null, 2)}
                    </pre>
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setShowTestModal(false)}
                className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTask;
