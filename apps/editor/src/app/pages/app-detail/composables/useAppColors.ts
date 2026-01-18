export function useAppColors() {
    const colors = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#ec4899'];
    const memberColors = ['#6366f1', '#22c55e', '#f97316', '#ef4444', '#3b82f6'];

    function getAppColor(id: number | string): string {
        const numId = typeof id === 'number' ? id : parseInt(String(id), 10) || 0;
        return colors[numId % colors.length] ?? colors[0] ?? '#2563eb';
    }

    function getMemberColor(id: number | string): string {
        const numId = typeof id === 'number' ? id : parseInt(String(id), 10) || 0;
        return memberColors[numId % memberColors.length] ?? memberColors[0] ?? '#6366f1';
    }

    return {
        getAppColor,
        getMemberColor
    };
}
