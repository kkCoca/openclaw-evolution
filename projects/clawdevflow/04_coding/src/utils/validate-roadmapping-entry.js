const fs = require('fs');
const crypto = require('crypto');

const REQUIRED_APPROVED_FIELDS = [
  'requirementsHash',
  'prdHash',
  'trdHash',
  'requirementsPath',
  'prdPath',
  'trdPath',
  'approvedBy',
  'approvedAt',
  'transitionId'
];

/**
 * Roadmapping Entry Gate 验证（P0-1 入口门禁）
 * 
 * 双重校验：
 * 1. execute() 进入 roadmapping 前校验一次
 * 2. executeStage('roadmapping') 内再校验一次（防绕过）
 * 
 * 校验内容：
 * - designing.stageStatus == passed
 * - designing.approved 存在且字段齐全
 * - 当前 PRD/TRD hash 与 approved hash 一致
 * 
 * @param {object} stateManager - 状态管理器
 * @param {object} state - 当前状态
 * @returns {{ok: boolean, reason?: string, details?: object}} 验证结果
 */
function validateRoadmappingEntry(stateManager, state) {
  const designingStage = state.stages.designing;
  
  // 1. 检查 designing.stageStatus == passed
  if (designingStage.stageStatus !== 'passed') {
    return {
      ok: false,
      reason: 'DESIGNING_NOT_PASSED',
      details: {
        currentStageStatus: designingStage.stageStatus,
        required: 'passed'
      }
    };
  }
  
  // 2. 检查 designing.approved 存在且字段齐全
  if (!designingStage.approved) {
    return {
      ok: false,
      reason: 'APPROVED_SNAPSHOT_MISSING',
      details: {
        message: 'designing.approved 快照不存在',
        required: REQUIRED_APPROVED_FIELDS
      }
    };
  }
  
  const approved = designingStage.approved;
  const missingFields = REQUIRED_APPROVED_FIELDS.filter(field => !approved[field]);
  if (missingFields.length > 0) {
    return {
      ok: false,
      reason: 'APPROVED_FIELDS_INCOMPLETE',
      details: {
        missingFields,
        required: REQUIRED_APPROVED_FIELDS
      }
    };
  }
  
  // 3. 检查 approved 路径文件存在
  const missingPaths = ['requirementsPath', 'prdPath', 'trdPath'].filter(
    key => !approved[key] || !fs.existsSync(approved[key])
  );
  if (missingPaths.length > 0) {
    return {
      ok: false,
      reason: 'APPROVED_PATH_MISSING',
      details: {
        missingPaths
      }
    };
  }
  
  // 4. 漂移校验：当前 PRD/TRD hash 与 approved hash 一致
  const prdContent = fs.readFileSync(approved.prdPath, 'utf8');
  const trdContent = fs.readFileSync(approved.trdPath, 'utf8');
  const currentPrdHash = crypto.createHash('sha256').update(prdContent).digest('hex');
  const currentTrdHash = crypto.createHash('sha256').update(trdContent).digest('hex');
  
  if (currentPrdHash !== approved.prdHash) {
    return {
      ok: false,
      reason: 'PRD_HASH_MISMATCH',
      details: {
        expected: approved.prdHash,
        actual: currentPrdHash,
        message: 'PRD.md 已被修改，与确认版本不一致'
      }
    };
  }
  
  if (currentTrdHash !== approved.trdHash) {
    return {
      ok: false,
      reason: 'TRD_HASH_MISMATCH',
      details: {
        expected: approved.trdHash,
        actual: currentTrdHash,
        message: 'TRD.md 已被修改，与确认版本不一致'
      }
    };
  }
  
  // 所有检查通过
  return {
    ok: true,
    reason: 'PASSED',
    details: {
      transitionId: approved.transitionId,
      approvedAt: approved.approvedAt,
      approvedBy: approved.approvedBy
    }
  };
}

module.exports = { validateRoadmappingEntry };
