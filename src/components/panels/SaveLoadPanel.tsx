import React, { useEffect, useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useGameStore } from '../../stores/gameStore';
import { SaveSystem } from '../../game/systems/SaveSystem';

interface SaveInfo {
  slot: number;
  slotName: string;
  timestamp: number;
  day: number;
}

interface Props {
  onClose: () => void;
}

const MANUAL_SLOTS = [1, 2, 3];

export const SaveLoadPanel: React.FC<Props> = ({ onClose }) => {
  const saveGame = useGameStore(s => s.saveGame);
  const loadGame = useGameStore(s => s.loadGame);
  const deleteSave = useGameStore(s => s.deleteSave);

  const [saves, setSaves] = useState<Record<number, SaveInfo>>({});
  const [names, setNames] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const list = await SaveSystem.listSaves();
    const map: Record<number, SaveInfo> = {};
    for (const s of list) map[s.slot] = s;
    setSaves(map);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = async (slot: number) => {
    setBusy(true);
    const name = names[slot]?.trim() || `存档 ${slot}`;
    const ok = await saveGame(slot, name);
    setBusy(false);
    setStatus({ ok, msg: ok ? `已保存到槽位 ${slot}` : '保存失败，请重试' });
    await refresh();
  };

  const handleLoad = async (slot: number) => {
    setBusy(true);
    const ok = await loadGame(slot);
    setBusy(false);
    if (ok) {
      onClose();
    } else {
      setStatus({ ok: false, msg: '读取失败，存档可能已损坏或不存在' });
    }
  };

  const handleDelete = async (slot: number) => {
    setBusy(true);
    const ok = await deleteSave(slot);
    setBusy(false);
    setStatus({ ok, msg: ok ? `已删除槽位 ${slot}` : '删除失败' });
    await refresh();
  };

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const renderSlot = (slot: number, label: string, isAuto: boolean) => {
    const info = saves[slot];
    return (
      <div key={slot} className="bg-slate-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-slate-200">{label}</p>
          {info && (
            <span className="text-[11px] text-slate-500">
              Day {info.day} · {fmtTime(info.timestamp)}
            </span>
          )}
        </div>
        <p className={`text-xs mb-3 ${info ? 'text-slate-400' : 'text-slate-600'}`}>
          {info ? `📁 ${info.slotName}` : '空槽位'}
        </p>

        {!isAuto && (
          <input
            value={names[slot] ?? `存档 ${slot}`}
            onChange={e => setNames(s => ({ ...s, [slot]: e.target.value }))}
            placeholder={`存档 ${slot}`}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-purple-500 mb-2"
          />
        )}

        <div className="flex gap-2">
          {!isAuto && (
            <Button variant="primary" size="sm" disabled={busy} onClick={() => handleSave(slot)}>
              保存
            </Button>
          )}
          <Button variant="secondary" size="sm" disabled={busy || !info} onClick={() => handleLoad(slot)}>
            读取
          </Button>
          {!isAuto && (
            <Button variant="ghost" size="sm" disabled={busy || !info} onClick={() => handleDelete(slot)}>
              删除
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Panel title="💾 存档管理" onClose={onClose}>
      <p className="text-xs text-slate-500 mb-4">
        游戏每日自动存档（自动档）。你也可手动保存多个槽位，随时读取继续经营。
      </p>

      <div className="space-y-3">
        {renderSlot(0, '🔄 自动存档', true)}
        {MANUAL_SLOTS.map(s => renderSlot(s, `📦 槽位 ${s}`, false))}
      </div>

      {status && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            status.ok ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300'
          }`}
        >
          {status.msg}
        </div>
      )}
    </Panel>
  );
};
