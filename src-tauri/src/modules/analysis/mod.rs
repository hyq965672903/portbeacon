//! 端口分析引擎模块。
//!
//! 执行顺序：
//! 0. `model` 定义分析过程使用的数据结构。
//! 1. `engine` 作为入口接收端口事实并编排完整流程。
//! 2. `source` 做来源追溯，识别直接来源和上游来源。
//! 3. `context` 做上下文补全，识别 runtime / cwd / project。
//! 4. `fingerprint` 补充服务指纹。
//! 5. `scoring` 做 owner / source / project / service / internal 分组证据打分。
//! 6. `classification` 做硬规则和分类决策。
//! 7. `feedback` 应用用户修正规则覆盖。
//! 8. `postprocess` 对同一进程的多端口关系做收敛，最后输出给 UI。

mod classification;
mod context;
mod engine;
mod feedback;
mod fingerprint;
mod model;
mod postprocess;
mod scoring;
mod source;

pub use engine::infer_port_context;
pub(crate) use feedback::apply_feedback_override;
pub use feedback::{
    delete_feedback_rule, init_feedback_rules, list_feedback_rules, save_feedback_rule,
};
pub use fingerprint::set_active_fingerprint_enabled;
pub use model::{ProcessEvidence, UserFeedbackRule};
pub(crate) use postprocess::refine_port_set_classification;
