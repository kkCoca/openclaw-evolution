#!/usr/bin/env node

/**
 * Designing Policy 验证器（v3.3.0）
 * 
 * 功能：
 * - 启动时验证 config.yaml 中的 designing.policy 配置
 * - 提供友好的错误提示
 * - 防止配置错误导致流程失败
 */

class DesigningPolicyValidator {
  /**
   * 验证 policy 配置
   * @param {object} policy - policy 配置对象
   * @returns {{valid: boolean, errors: string[], warnings: string[]}}
   */
  static validate(policy) {
    const errors = [];
    const warnings = [];

    // 1. 验证 approvals 配置
    if (!policy.approvals) {
      errors.push('缺少 approvals 配置');
    } else {
      // 验证 mode
      const validModes = ['two_step', 'one_step', 'auto'];
      if (!validModes.includes(policy.approvals.mode)) {
        errors.push(`approvals.mode 必须是 ${validModes.join(' | ')}，当前为 "${policy.approvals.mode}"`);
      }

      // 验证 small_scope（v3.3.0/v3.4.0）
      // 注意：Phase 1 已禁用 small-scope 合并确认，但保留配置以便未来启用
      // TODO: 未来可能需要重命名为 small_scope_heuristic 以匹配方案文档
      if (policy.approvals.small_scope) {
        if (typeof policy.approvals.small_scope.max_requirements !== 'number' ||
            policy.approvals.small_scope.max_requirements < 1) {
          errors.push('small_scope.max_requirements 必须是 >= 1 的数字');
        }

        if (typeof policy.approvals.small_scope.max_prd_lines !== 'number' ||
            policy.approvals.small_scope.max_prd_lines < 50) {
          errors.push('small_scope.max_prd_lines 必须是 >= 50 的数字');
        }

        if (typeof policy.approvals.small_scope.max_trd_lines !== 'number' ||
            policy.approvals.small_scope.max_trd_lines < 50) {
          errors.push('small_scope.max_trd_lines 必须是 >= 50 的数字');
        }
      }

      // 验证 timeout
      if (policy.approvals.timeout) {
        if (typeof policy.approvals.timeout.prd_confirmation !== 'number' ||
            policy.approvals.timeout.prd_confirmation < 60) {
          errors.push('timeout.prd_confirmation 必须是 >= 60（秒）的数字');
        }

        if (typeof policy.approvals.timeout.trd_confirmation !== 'number' ||
            policy.approvals.timeout.trd_confirmation < 60) {
          errors.push('timeout.trd_confirmation 必须是 >= 60（秒）的数字');
        }
      }
    }

    // 2. 验证 conditional_blocks_progress
    if (typeof policy.conditional_blocks_progress !== 'boolean') {
      errors.push('conditional_blocks_progress 必须是布尔值');
    }

    // 3. 验证 blocking_rule
    const validBlockingRules = ['blocking_issues_nonempty', 'score_threshold'];
    if (!validBlockingRules.includes(policy.blocking_rule)) {
      errors.push(`blocking_rule 必须是 ${validBlockingRules.join(' | ')}，当前为 "${policy.blocking_rule}"`);
    }

    // 4. 验证 retry 配置
    if (!policy.retry) {
      errors.push('缺少 retry 配置');
    } else {
      if (typeof policy.retry.max_total_retries !== 'number' ||
          policy.retry.max_total_retries < 1) {
        errors.push('retry.max_total_retries 必须是 >= 1 的数字');
      }

      if (policy.retry.max_retries_per_issue) {
        if (typeof policy.retry.max_retries_per_issue !== 'object') {
          errors.push('retry.max_retries_per_issue 必须是对象');
        } else {
          // 验证每个 issue 的重试次数
          for (const [issueId, count] of Object.entries(policy.retry.max_retries_per_issue)) {
            if (typeof count !== 'number' || count < 1) {
              errors.push(`retry.max_retries_per_issue.${issueId} 必须是 >= 1 的数字`);
            }
          }

          // 必须有 DEFAULT
          if (!policy.retry.max_retries_per_issue.DEFAULT) {
            errors.push('retry.max_retries_per_issue 必须包含 DEFAULT 配置');
          }
        }
      }

      if (typeof policy.retry.same_issue_streak_limit !== 'number' ||
          policy.retry.same_issue_streak_limit < 1) {
        errors.push('retry.same_issue_streak_limit 必须是 >= 1 的数字');
      }
    }

    // 5. 验证 escalation 配置
    if (!policy.escalation) {
      errors.push('缺少 escalation 配置');
    } else {
      const validEscalations = ['clarify_required', 'terminate', 'notify_user'];
      if (!validEscalations.includes(policy.escalation.on_retry_exhausted)) {
        errors.push(`escalation.on_retry_exhausted 必须是 ${validEscalations.join(' | ')}，当前为 "${policy.escalation.on_retry_exhausted}"`);
      }
    }

    // 6. 验证 severity_model（v3.3.0）
    if (policy.severity_model) {
      if (!Array.isArray(policy.severity_model.blocker)) {
        errors.push('severity_model.blocker 必须是数组');
      }

      if (!Array.isArray(policy.severity_model.warning)) {
        errors.push('severity_model.warning 必须是数组');
      }

      // 警告：检查是否有重复
      if (policy.severity_model.blocker && policy.severity_model.warning) {
        const blockerSet = new Set(policy.severity_model.blocker);
        const warningSet = new Set(policy.severity_model.warning);
        const intersection = [...blockerSet].filter(x => warningSet.has(x));

        if (intersection.length > 0) {
          warnings.push(`severity_model 中 blocker 和 warning 有重复项：${intersection.join(', ')}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证并抛出异常（如果失败）
   * @param {object} policy - policy 配置对象
   */
  static validateOrThrow(policy) {
    const result = this.validate(policy);

    if (!result.valid) {
      const errorMsg = [
        'Designing policy 配置错误：',
        ...result.errors.map(e => `  - ${e}`)
      ].join('\n');

      throw new Error(errorMsg);
    }

    // 输出警告
    if (result.warnings.length > 0) {
      console.warn('[Policy Validator] 警告：');
      result.warnings.forEach(w => console.warn(`  - ${w}`));
    }

    console.log('[Policy Validator] ✅ Designing policy 配置验证通过');
  }
}

module.exports = DesigningPolicyValidator;
