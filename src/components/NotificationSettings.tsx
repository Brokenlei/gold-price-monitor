import { useState, useEffect } from 'react';
import { requestNotificationPermission, checkNotificationPermission, PriceAlert } from '../services/notificationService';
import usePriceStore from '../store/priceStore';

interface NotificationSettingsProps {
  onClose: () => void;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { prices } = usePriceStore();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [newAlert, setNewAlert] = useState({ productId: 'gold', threshold: 0, type: 'above' as 'above' | 'below' });

  useEffect(() => {
    checkNotificationPermission().then(setPermissionGranted).finally(() => setLoading(false));
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
  };

  const handleAddAlert = () => {
    const product = prices.find(p => p.id === newAlert.productId);
    if (!product || newAlert.threshold <= 0) return;

    const alert: PriceAlert = {
      productId: newAlert.productId,
      productName: product.name,
      price: product.usdPrice,
      type: newAlert.type,
      threshold: newAlert.threshold,
    };

    setAlerts(prev => [...prev, alert]);
    setNewAlert({ productId: 'gold', threshold: 0, type: 'above' });
  };

  const handleRemoveAlert = (index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-600 w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">通知设置</h2>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 transition-colors"
          >
            关闭
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-96">
          {/* 权限申请 */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">通知权限</h3>
            {loading ? (
              <p className="text-slate-400 text-sm">检查中...</p>
            ) : permissionGranted ? (
              <div className="flex items-center gap-2 text-green-400">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>已开启通知</span>
              </div>
            ) : (
              <button
                onClick={handleRequestPermission}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                开启通知
              </button>
            )}
          </div>

          {/* 价格提醒设置 */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">价格提醒</h3>
            
            {/* 添加新提醒 */}
            <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
              <div className="flex gap-2 mb-2">
                <select
                  value={newAlert.productId}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, productId: e.target.value }))}
                  className="flex-1 bg-slate-600 text-white rounded px-3 py-2 text-sm"
                >
                  {prices.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={newAlert.type}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, type: e.target.value as 'above' | 'below' }))}
                  className="bg-slate-600 text-white rounded px-3 py-2 text-sm"
                >
                  <option value="above">高于</option>
                  <option value="below">低于</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newAlert.threshold || ''}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }))}
                  placeholder="输入价格"
                  className="flex-1 bg-slate-600 text-white rounded px-3 py-2 text-sm"
                />
                <button
                  onClick={handleAddAlert}
                  disabled={newAlert.threshold <= 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:text-slate-400 transition-colors text-sm"
                >
                  添加
                </button>
              </div>
            </div>

            {/* 已有提醒列表 */}
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <div key={index} className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">{alert.productName}</span>
                      <span className="text-slate-400 text-sm ml-2">
                        {alert.type === 'above' ? '>=' : '<='} ${alert.threshold.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveAlert(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">暂无价格提醒</p>
            )}
          </div>

          {/* 说明 */}
          <div className="text-slate-400 text-xs">
            <p className="mb-2">提示：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>开启通知后，当价格变动时会收到推送</li>
              <li>可以设置价格提醒，当价格达到设定值时通知</li>
              <li>通知频率限制：同一商品1分钟内最多通知1次</li>
              <li>需要在手机设置中允许应用通知</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
