// helpers/checkUsageHelper.js

const mongoose = require('mongoose');
const usageMap = require('./usageMap');

const checkUsage = async (modelType, targetId) => {
  const rules = usageMap[modelType] || [];

  const summary = [];
  const dependencies = {};

  for (const { model, field, label } of rules) {
    try {
      const Model = mongoose.model(model); // no need to import manually
      const count = await Model.countDocuments({ [field]: targetId });

      if (count > 0) {
        summary.push(`used in ${count} ${label}`);
        dependencies[label] = count;
      }
    } catch (err) {
      console.warn(`⚠️ Model "${model}" check failed:`, err.message);
    }
  }

  return {
    isUsed: summary.length > 0,
    message: summary.join(', '),
    dependencies
  };
};

module.exports = { checkUsage };
