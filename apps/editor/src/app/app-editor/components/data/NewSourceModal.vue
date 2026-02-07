<template>
    <f7-popup class="new-source-popup" :opened="opened" @popup:closed="$emit('update:opened', false)">
        <f7-view>
            <f7-page>
                <f7-navbar title="Add Data Source">
                    <f7-nav-right>
                        <f7-link popup-close>Close</f7-link>
                    </f7-nav-right>
                </f7-navbar>

                <f7-block class="display-flex justify-content-center align-items-center" style="height: 100%">
                    <div class="width-100" style="max-width: 600px">
                        <p class="text-align-center text-color-gray margin-bottom-double">Choose how you want to create your data source</p>
                        
                        <div class="row">
                            <!-- Option 1: Blank Table -->
                            <div class="col-50 tablet-50 desktop-33">
                                <div class="card source-option" @click="selectOption('blank')">
                                    <div class="card-content card-content-padding text-align-center">
                                        <f7-icon f7="square_grid_2x2" size="48" class="text-color-blue margin-bottom-half" />
                                        <div class="font-bold margin-bottom-half">Blank Table</div>
                                        <div class="text-color-gray size-12">Create a new empty table and define fields manually</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Option 2: Excel Import -->
                            <div class="col-50 tablet-50 desktop-33">
                                <div class="card source-option" @click="selectOption('excel')">
                                    <div class="card-content card-content-padding text-align-center">
                                        <f7-icon f7="arrow_up_doc_fill" size="48" class="text-color-green margin-bottom-half" />
                                        <div class="font-bold margin-bottom-half">Import Excel</div>
                                        <div class="text-color-gray size-12">Upload .xlsx or .csv to auto-generate table schema</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Option 3: Google Sheets -->
                            <div class="col-50 tablet-50 desktop-33">
                                <div class="card source-option disabled">
                                    <div class="card-content card-content-padding text-align-center">
                                        <f7-icon f7="logo_google" size="48" class="text-color-gray margin-bottom-half" />
                                        <div class="font-bold text-color-gray margin-bottom-half">Google Sheets</div>
                                        <div class="text-color-gray size-12">2-way sync with Google Sheets (Coming Soon)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </f7-block>
            </f7-page>
        </f7-view>
    </f7-popup>
</template>

<script setup lang="ts">
const props = defineProps<{
    opened: boolean;
}>();

const emit = defineEmits(['update:opened', 'select']);

function selectOption(type: 'blank' | 'excel') {
    emit('select', type);
    emit('update:opened', false);
}
</script>

<style scoped>
.source-option {
    cursor: pointer;
    transition: all 0.2s;
    height: 100%;
    border: 1px solid transparent;
}

.source-option:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: #3b82f6;
}

.source-option.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f9fafb;
}

.size-12 {
    font-size: 12px;
    line-height: 1.4;
}
</style>
