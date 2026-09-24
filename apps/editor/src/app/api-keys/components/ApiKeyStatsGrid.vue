<template>
  <section class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon blue">
        <f7-icon f7="key_fill" />
      </div>
      <div class="stat-info">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Total API Keys</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon green">
        <f7-icon f7="checkmark_shield_fill" />
      </div>
      <div class="stat-info">
        <div class="stat-value">{{ stats.active }}</div>
        <div class="stat-label">Kunci Aktif</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon purple">
        <f7-icon f7="bolt_fill" />
      </div>
      <div class="stat-info">
        <div class="stat-value">{{ stats.liveKeys }}</div>
        <div class="stat-label">Live Production</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon orange">
        <f7-icon f7="chart_bar_fill" />
      </div>
      <div class="stat-info">
        <div class="stat-value">{{ stats.totalRequests.toLocaleString() }}</div>
        <div class="stat-label">Total Permintaan</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  stats: {
    total: number;
    active: number;
    liveKeys: number;
    totalRequests: number;
  };
}>();
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.blue {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon.green {
  background: #f0fdf4;
  color: #16a34a;
}

.stat-icon.purple {
  background: #faf5ff;
  color: #9333ea;
}

.stat-icon.orange {
  background: #fff7ed;
  color: #ea580c;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.stat-label {
  font-size: 12.5px;
  color: #64748b;
  margin-top: 2px;
}
</style>
