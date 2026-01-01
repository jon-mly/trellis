import type { ReactElement } from 'react';
import { useState, useMemo, useCallback } from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { SegmentedButton } from '../common';
import type { SegmentedButtonOption } from '../common';
import type { TeachingStyle } from '../../types';
import { useI18n } from '../../i18n';
import './TeachingStyleView.css';

type Preset = NonNullable<TeachingStyle['preset']>;
type Depth = TeachingStyle['parameters']['depth'];
type Pace = TeachingStyle['parameters']['pace'];
type ExampleFrequency = TeachingStyle['parameters']['exampleFrequency'];
type Formality = TeachingStyle['parameters']['formality'];

interface TeachingStyleViewProps {
  teachingStyle: TeachingStyle;
  onSave: (style: TeachingStyle) => void;
  onBack: () => void;
}

function generatePrompt(style: TeachingStyle, t: ReturnType<typeof useI18n>): string {
  const { parameters, preset, customInstructions } = style;
  const lines: string[] = [];

  if (preset) {
    const presetLabels: Record<Preset, string> = {
      socratic: t.teachingStyle.preset.options.socratic,
      'hands-on': t.teachingStyle.preset.options.handsOn,
      theoretical: t.teachingStyle.preset.options.theoretical,
      storyteller: t.teachingStyle.preset.options.storyteller,
    };
    lines.push(`Teaching approach: ${presetLabels[preset]}`);
  }

  const depthMap: Record<Depth, string> = {
    shallow: 'Keep explanations brief and high-level.',
    moderate: 'Provide balanced explanations with some detail.',
    deep: 'Go in-depth with comprehensive explanations.',
  };
  lines.push(depthMap[parameters.depth]);

  const paceMap: Record<Pace, string> = {
    quick: 'Move quickly through concepts.',
    measured: 'Take a measured pace, allowing time for understanding.',
    thorough: 'Be thorough, ensuring complete comprehension before moving on.',
  };
  lines.push(paceMap[parameters.pace]);

  const exampleMap: Record<ExampleFrequency, string> = {
    minimal: 'Use examples sparingly, only when essential.',
    moderate: 'Include examples when helpful to illustrate points.',
    frequent: 'Use frequent examples to reinforce each concept.',
  };
  lines.push(exampleMap[parameters.exampleFrequency]);

  if (parameters.useAnalogies) {
    lines.push('Use analogies and metaphors to relate new concepts to familiar ideas.');
  } else {
    lines.push('Focus on direct explanations without analogies.');
  }

  const formalityMap: Record<Formality, string> = {
    casual: 'Use a casual, conversational tone.',
    balanced: 'Use a balanced, approachable professional tone.',
    formal: 'Use a formal, academic tone.',
  };
  lines.push(formalityMap[parameters.formality]);

  if (customInstructions?.trim()) {
    lines.push('');
    lines.push(`Additional instructions: ${customInstructions.trim()}`);
  }

  return lines.join('\n');
}

export function TeachingStyleView({
  teachingStyle,
  onSave,
  onBack,
}: TeachingStyleViewProps): ReactElement {
  const t = useI18n();
  const [style, setStyle] = useState<TeachingStyle>(teachingStyle);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const presetOptions: SegmentedButtonOption<Preset>[] = useMemo(() => [
    { value: 'socratic', label: t.teachingStyle.preset.options.socratic },
    { value: 'hands-on', label: t.teachingStyle.preset.options.handsOn },
    { value: 'theoretical', label: t.teachingStyle.preset.options.theoretical },
    { value: 'storyteller', label: t.teachingStyle.preset.options.storyteller },
  ], [t]);

  const depthOptions: SegmentedButtonOption<Depth>[] = useMemo(() => [
    { value: 'shallow', label: t.teachingStyle.depth.options.shallow },
    { value: 'moderate', label: t.teachingStyle.depth.options.moderate },
    { value: 'deep', label: t.teachingStyle.depth.options.deep },
  ], [t]);

  const paceOptions: SegmentedButtonOption<Pace>[] = useMemo(() => [
    { value: 'quick', label: t.teachingStyle.pace.options.quick },
    { value: 'measured', label: t.teachingStyle.pace.options.measured },
    { value: 'thorough', label: t.teachingStyle.pace.options.thorough },
  ], [t]);

  const exampleOptions: SegmentedButtonOption<ExampleFrequency>[] = useMemo(() => [
    { value: 'minimal', label: t.teachingStyle.exampleFrequency.options.minimal },
    { value: 'moderate', label: t.teachingStyle.exampleFrequency.options.moderate },
    { value: 'frequent', label: t.teachingStyle.exampleFrequency.options.frequent },
  ], [t]);

  const analogyOptions: SegmentedButtonOption<'enabled' | 'disabled'>[] = useMemo(() => [
    { value: 'enabled', label: t.teachingStyle.analogies.options.enabled },
    { value: 'disabled', label: t.teachingStyle.analogies.options.disabled },
  ], [t]);

  const formalityOptions: SegmentedButtonOption<Formality>[] = useMemo(() => [
    { value: 'casual', label: t.teachingStyle.formality.options.casual },
    { value: 'balanced', label: t.teachingStyle.formality.options.balanced },
    { value: 'formal', label: t.teachingStyle.formality.options.formal },
  ], [t]);

  const generatedPrompt = useMemo(() => generatePrompt(style, t), [style, t]);

  const updateStyle = useCallback(<K extends keyof TeachingStyle>(
    key: K,
    value: TeachingStyle[K]
  ) => {
    setStyle((prev) => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  }, []);

  const updateParameter = useCallback(<K extends keyof TeachingStyle['parameters']>(
    key: K,
    value: TeachingStyle['parameters'][K]
  ) => {
    setStyle((prev) => ({
      ...prev,
      parameters: { ...prev.parameters, [key]: value },
    }));
    setSaveStatus('idle');
  }, []);

  const handleSave = useCallback(() => {
    onSave(style);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [style, onSave]);

  return (
    <div className="teaching-style-view">
      <header className="teaching-style-header">
        <button
          type="button"
          className="teaching-style-back-btn"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="teaching-style-title">{t.teachingStyle.title}</h1>
          <p className="teaching-style-description">{t.teachingStyle.description}</p>
        </div>
      </header>

      <div className="teaching-style-content">
        <div className="teaching-style-controls">
          <SegmentedButton
            label={t.teachingStyle.preset.label}
            options={presetOptions}
            value={style.preset ?? 'socratic'}
            onChange={(value) => updateStyle('preset', value)}
          />

          <SegmentedButton
            label={t.teachingStyle.depth.label}
            options={depthOptions}
            value={style.parameters.depth}
            onChange={(value) => updateParameter('depth', value)}
          />

          <SegmentedButton
            label={t.teachingStyle.pace.label}
            options={paceOptions}
            value={style.parameters.pace}
            onChange={(value) => updateParameter('pace', value)}
          />

          <SegmentedButton
            label={t.teachingStyle.exampleFrequency.label}
            options={exampleOptions}
            value={style.parameters.exampleFrequency}
            onChange={(value) => updateParameter('exampleFrequency', value)}
          />

          <SegmentedButton
            label={t.teachingStyle.analogies.label}
            options={analogyOptions}
            value={style.parameters.useAnalogies ? 'enabled' : 'disabled'}
            onChange={(value) => updateParameter('useAnalogies', value === 'enabled')}
          />

          <SegmentedButton
            label={t.teachingStyle.formality.label}
            options={formalityOptions}
            value={style.parameters.formality}
            onChange={(value) => updateParameter('formality', value)}
          />

          <div className="teaching-style-custom">
            <label className="teaching-style-custom-label">
              {t.teachingStyle.customInstructions.label}
            </label>
            <textarea
              className="teaching-style-custom-input"
              placeholder={t.teachingStyle.customInstructions.placeholder}
              value={style.customInstructions ?? ''}
              onChange={(e) => updateStyle('customInstructions', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="teaching-style-preview">
          <div className="teaching-style-preview-header">
            <label className="teaching-style-preview-label">
              {t.teachingStyle.promptPreview.label}
            </label>
            <p className="teaching-style-preview-description">
              {t.teachingStyle.promptPreview.description}
            </p>
          </div>
          <pre className="teaching-style-preview-content">{generatedPrompt}</pre>
        </div>

        <button
          type="button"
          className="teaching-style-save-btn"
          onClick={handleSave}
        >
          {saveStatus === 'saved' ? (
            <>
              <Check size={16} strokeWidth={1.5} />
              <span>{t.teachingStyle.saved}</span>
            </>
          ) : (
            <span>{t.teachingStyle.save}</span>
          )}
        </button>
      </div>
    </div>
  );
}
