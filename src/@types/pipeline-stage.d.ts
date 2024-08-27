declare module 'mongoose' {
  export type FacetPipelineStage = Exclude<PipelineStage,
  PipelineStage.CollStats |
  PipelineStage.Facet |
  PipelineStage.GeoNear |
  PipelineStage.IndexStats |
  PipelineStage.Out |
  PipelineStage.Merge |
  PipelineStage.PlanCacheStats
  >;
}
