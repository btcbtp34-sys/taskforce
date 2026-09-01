export interface PresentationSlide {
  id: number;
  slideNumber: number;
  title: string;
  subtitle: string;
  section: string;
  bulletPoints: string[];
  highlightText?: string;
  metricBox?: {
    label: string;
    value: string;
    subtext: string;
  };
  chartType?: 'landscape' | 'opportunities' | 'financial' | 'roadmap';
}
