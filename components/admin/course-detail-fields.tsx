"use client";

import { LESSON_ICONS, type CourseDetail, type Lesson } from "@/lib/data";
import { emptyCourseDetail } from "@/lib/course";
import { UploadField } from "@/components/admin/upload-field";
import { Input } from "@/components/ui/input";
import { StringListEditor, moveItem } from "@/components/admin/list-editor";

export function CourseDetailFields({
  value,
  onChange,
}: {
  value?: CourseDetail;
  onChange: (next: CourseDetail) => void;
}) {
  const detail = value ?? emptyCourseDetail();
  const set = (patch: Partial<CourseDetail>) => onChange({ ...detail, ...patch });

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-[20px]">课程详情</h2>
      <p className="text-[12px] text-[#777]">
        片头是介绍，只出现在商品详情/首页。正课视频加在课节里，学员在「线上录播课」和「我的学习」观看。
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[13px]">
          主讲
          <Input value={detail.lecturer || ""} onChange={(e) => set({ lecturer: e.target.value })} className="mt-1 h-9" />
        </label>
        <label className="block text-[13px]">
          片头时长
          <Input value={detail.duration || ""} onChange={(e) => set({ duration: e.target.value })} placeholder="02:06" className="mt-1 h-9" />
        </label>
        <label className="block text-[13px]">
          片头叠字
          <Input value={detail.heroOverlay || ""} onChange={(e) => set({ heroOverlay: e.target.value })} className="mt-1 h-9" />
        </label>
        <label className="block text-[13px]">
          片头副标
          <Input value={detail.heroSub || ""} onChange={(e) => set({ heroSub: e.target.value })} className="mt-1 h-9" />
        </label>
      </div>
      <label className="block text-[13px]">
        片头角标
        <Input value={detail.heroKicker || ""} onChange={(e) => set({ heroKicker: e.target.value })} className="mt-1 h-9" />
      </label>
      <UploadField
        label="片头封面 / 海报"
        value={detail.introPoster || ""}
        onChange={(introPoster) => set({ introPoster })}
        accept="image/*"
      />
      <UploadField
        label="片头视频（上传或粘贴 URL）"
        value={detail.introVideoUrl || ""}
        onChange={(introVideoUrl) => set({ introVideoUrl })}
        accept="video/*"
        hint="片头是介绍，不是正课。第1节到第10节的录播请加在下方课节里。"
      />
      <label className="block text-[13px]">
        价值主张
        <Input value={detail.valueLine || ""} onChange={(e) => set({ valueLine: e.target.value })} className="mt-1 h-9" />
      </label>
      <label className="block text-[13px]">
        课程介绍正文
        <textarea
          value={detail.body || ""}
          onChange={(e) => set({ body: e.target.value })}
          rows={5}
          className="mt-1 w-full rounded-md border border-input px-3 py-2"
        />
      </label>

      <PairList
        title="三大支柱"
        left="标题"
        right="说明"
        rows={detail.pillars}
        onChange={(pillars) => set({ pillars })}
      />
      <label className="block text-[13px]">
        数据条上方文案
        <Input value={detail.statsLine || ""} onChange={(e) => set({ statsLine: e.target.value })} className="mt-1 h-9" />
      </label>
      <PairList
        title="数据条"
        left="数字/主词"
        right="标签"
        leftKey="value"
        rightKey="label"
        rows={detail.stats}
        onChange={(stats) => set({ stats })}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[13px]">
          大纲标题
          <Input value={detail.lessonsTitle || ""} onChange={(e) => set({ lessonsTitle: e.target.value })} className="mt-1 h-9" />
        </label>
        <label className="block text-[13px]">
          大纲副标
          <Input value={detail.lessonsTag || ""} onChange={(e) => set({ lessonsTag: e.target.value })} className="mt-1 h-9" />
        </label>
      </div>

      <div className="rounded-lg border border-[#efe6d4] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium">正课 / 录播课节</p>
          <button
            type="button"
            className="text-[12px] text-[#8a5a20]"
            onClick={() =>
              set({
                lessons: [
                  ...detail.lessons,
                  { index: detail.lessons.length + 1, title: "", icon: "play" },
                ],
              })
            }
          >
            增加一节
          </button>
        </div>
        <p className="mt-1 text-[12px] text-[#888]">每一节可单独上传或粘贴正课视频，不要放到上面的片头里。</p>
        <div className="mt-3 space-y-3">
          {detail.lessons.map((lesson, index) => (
            <div key={index} className="rounded-md bg-[#faf6ee] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-[#888]">第{index + 1}节</span>
                <input
                  value={lesson.title}
                  onChange={(event) => {
                    const lessons = [...detail.lessons];
                    lessons[index] = { ...lesson, title: event.target.value, index: index + 1 };
                    set({ lessons: reindexLessons(lessons) });
                  }}
                  className="h-8 min-w-[180px] flex-1 rounded border border-input px-2 text-[13px]"
                  placeholder="课时标题"
                />
                <input
                  value={lesson.duration || ""}
                  onChange={(event) => {
                    const lessons = [...detail.lessons];
                    lessons[index] = { ...lesson, duration: event.target.value };
                    set({ lessons });
                  }}
                  className="h-8 w-24 rounded border border-input px-2 text-[13px]"
                  placeholder="时长 12:00"
                />
                <select
                  value={lesson.icon}
                  onChange={(event) => {
                    const lessons = [...detail.lessons];
                    lessons[index] = { ...lesson, icon: event.target.value as Lesson["icon"] };
                    set({ lessons });
                  }}
                  className="h-8 rounded border border-input bg-white px-1 text-[12px]"
                >
                  {LESSON_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-[12px] text-[#666]">
                  <input
                    type="checkbox"
                    checked={Boolean(lesson.highlight)}
                    onChange={(event) => {
                      const lessons = [...detail.lessons];
                      lessons[index] = { ...lesson, highlight: event.target.checked };
                      set({ lessons });
                    }}
                  />
                  高亮
                </label>
                <button type="button" className="text-[12px]" onClick={() => set({ lessons: reindexLessons(moveItem(detail.lessons, index, -1)) })}>
                  上移
                </button>
                <button type="button" className="text-[12px]" onClick={() => set({ lessons: reindexLessons(moveItem(detail.lessons, index, 1)) })}>
                  下移
                </button>
                <button
                  type="button"
                  className="text-[12px] text-[#888]"
                  onClick={() => set({ lessons: reindexLessons(detail.lessons.filter((_, i) => i !== index)) })}
                >
                  删除
                </button>
              </div>
              <div className="mt-2">
                <UploadField
                  label={`第${index + 1}节正课视频`}
                  value={lesson.videoUrl || ""}
                  onChange={(videoUrl) => {
                    const lessons = [...detail.lessons];
                    lessons[index] = { ...lesson, videoUrl };
                    set({ lessons });
                  }}
                  accept="video/*"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <StringListEditor label="路径步骤（箭头流程）" values={detail.flow} onChange={(flow) => set({ flow })} />

      <div className="rounded-lg border border-[#efe6d4] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium">直播场次</p>
          <button
            type="button"
            className="text-[12px] text-[#8a5a20]"
            onClick={() =>
              set({
                lives: [...detail.lives, { index: detail.lives.length + 1, title: "", items: [] }],
              })
            }
          >
            增加一场
          </button>
        </div>
        <label className="mt-2 block text-[13px]">
          最后一场附注
          <Input value={detail.liveNote || ""} onChange={(e) => set({ liveNote: e.target.value })} className="mt-1 h-9" />
        </label>
        <div className="mt-3 space-y-3">
          {detail.lives.map((live, index) => (
            <div key={index} className="rounded-md bg-[#faf6ee] p-3">
              <div className="flex gap-2">
                <input
                  value={live.title}
                  onChange={(event) => {
                    const lives = [...detail.lives];
                    lives[index] = { ...live, title: event.target.value, index: index + 1 };
                    set({ lives });
                  }}
                  placeholder={`直播第${index + 1}场标题`}
                  className="h-8 flex-1 rounded border border-input px-2 text-[13px]"
                />
                <button type="button" className="text-[12px]" onClick={() => set({ lives: reindexLives(moveItem(detail.lives, index, -1)) })}>
                  上移
                </button>
                <button type="button" className="text-[12px]" onClick={() => set({ lives: reindexLives(moveItem(detail.lives, index, 1)) })}>
                  下移
                </button>
                <button
                  type="button"
                  className="text-[12px] text-[#888]"
                  onClick={() => set({ lives: reindexLives(detail.lives.filter((_, i) => i !== index)) })}
                >
                  删除
                </button>
              </div>
              <textarea
                value={live.items.join("\n")}
                onChange={(event) => {
                  const lives = [...detail.lives];
                  lives[index] = {
                    ...live,
                    items: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                  };
                  set({ lives });
                }}
                rows={3}
                placeholder="每行一个要点"
                className="mt-2 w-full rounded border border-input px-2 py-1 text-[13px]"
              />
              <label className="mt-2 block text-[13px]">
                会议 / 直播链接（选填）
                <Input
                  value={live.meetingUrl || ""}
                  onChange={(event) => {
                    const lives = [...detail.lives];
                    lives[index] = { ...live, meetingUrl: event.target.value };
                    set({ lives });
                  }}
                  placeholder="https://"
                  className="mt-1 h-9"
                />
              </label>
              <div className="mt-2">
                <UploadField
                  label="本场回放视频（选填）"
                  value={live.videoUrl || ""}
                  onChange={(videoUrl) => {
                    const lives = [...detail.lives];
                    lives[index] = { ...live, videoUrl };
                    set({ lives });
                  }}
                  accept="video/*"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="block text-[13px]">
        收获区标题
        <Input value={detail.outcomesTitle || ""} onChange={(e) => set({ outcomesTitle: e.target.value })} className="mt-1 h-9" />
      </label>
      <StringListEditor
        label="完成课程后你将拥有"
        values={detail.outcomes.map((item) => item.title)}
        onChange={(titles) => set({ outcomes: titles.map((title) => ({ title })) })}
      />
      <label className="block text-[13px]">
        适合人群标题
        <Input value={detail.audiencesTitle || ""} onChange={(e) => set({ audiencesTitle: e.target.value })} className="mt-1 h-9" />
      </label>
      <StringListEditor
        label="适合谁"
        values={detail.audiences.map((item) => item.title)}
        onChange={(titles) => set({ audiences: titles.map((title) => ({ title })) })}
      />
      <StringListEditor label="免责声明" values={detail.disclaimer} onChange={(disclaimer) => set({ disclaimer })} />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[13px]">
          底部号召
          <Input value={detail.joinLine || ""} onChange={(e) => set({ joinLine: e.target.value })} className="mt-1 h-9" />
        </label>
        <label className="block text-[13px]">
          底部副文案
          <Input value={detail.joinSub || ""} onChange={(e) => set({ joinSub: e.target.value })} className="mt-1 h-9" />
        </label>
      </div>

      <div className="rounded-lg border border-[#efe6d4] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium">额外章节（学习计划 / 适用场景等）</p>
          <button
            type="button"
            className="text-[12px] text-[#8a5a20]"
            onClick={() => set({ extraSections: [...detail.extraSections, { title: "", body: "", items: [] }] })}
          >
            增加章节
          </button>
        </div>
        <p className="mt-1 text-[12px] text-[#888]">
          标题含「学习计划 / 日程 / 安排」时，前台会按编号网格展示列表项。
        </p>
        <div className="mt-3 space-y-3">
          {detail.extraSections.map((section, index) => (
            <div key={index} className="rounded-md bg-[#faf6ee] p-3">
              <div className="flex gap-2">
                <input
                  value={section.title}
                  onChange={(event) => {
                    const extraSections = [...detail.extraSections];
                    extraSections[index] = { ...section, title: event.target.value };
                    set({ extraSections });
                  }}
                  placeholder="章节标题，如 15天学习计划"
                  className="h-8 flex-1 rounded border border-input px-2 text-[13px]"
                />
                <button
                  type="button"
                  className="text-[12px]"
                  onClick={() => set({ extraSections: moveItem(detail.extraSections, index, -1) })}
                >
                  上移
                </button>
                <button
                  type="button"
                  className="text-[12px]"
                  onClick={() => set({ extraSections: moveItem(detail.extraSections, index, 1) })}
                >
                  下移
                </button>
                <button
                  type="button"
                  className="text-[12px] text-[#888]"
                  onClick={() => set({ extraSections: detail.extraSections.filter((_, i) => i !== index) })}
                >
                  删除
                </button>
              </div>
              <textarea
                value={section.body || ""}
                onChange={(event) => {
                  const extraSections = [...detail.extraSections];
                  extraSections[index] = { ...section, body: event.target.value };
                  set({ extraSections });
                }}
                rows={3}
                placeholder="正文（可空）"
                className="mt-2 w-full rounded border border-input px-2 py-1 text-[13px]"
              />
              <textarea
                value={(section.items || []).join("\n")}
                onChange={(event) => {
                  const extraSections = [...detail.extraSections];
                  extraSections[index] = {
                    ...section,
                    items: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                  };
                  set({ extraSections });
                }}
                rows={3}
                placeholder="列表要点，每行一项"
                className="mt-2 w-full rounded border border-input px-2 py-1 text-[13px]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function reindexLessons(lessons: Lesson[]) {
  return lessons.map((lesson, index) => ({ ...lesson, index: index + 1 }));
}

function reindexLives<T extends { index: number }>(lives: T[]) {
  return lives.map((live, index) => ({ ...live, index: index + 1 }));
}

function PairList<T extends Record<string, string>>({
  title,
  rows,
  onChange,
  left,
  right,
  leftKey = "title",
  rightKey = "desc",
}: {
  title: string;
  rows: T[];
  onChange: (next: T[]) => void;
  left: string;
  right: string;
  leftKey?: string;
  rightKey?: string;
}) {
  return (
    <div className="rounded-lg border border-[#efe6d4] p-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">{title}</p>
        <button
          type="button"
          className="text-[12px] text-[#8a5a20]"
          onClick={() => onChange([...rows, { [leftKey]: "", [rightKey]: "" } as T])}
        >
          增加一项
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={row[leftKey] || ""}
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...row, [leftKey]: event.target.value };
                onChange(next);
              }}
              placeholder={left}
              className="h-8 w-28 rounded border border-input px-2 text-[13px]"
            />
            <input
              value={row[rightKey] || ""}
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...row, [rightKey]: event.target.value };
                onChange(next);
              }}
              placeholder={right}
              className="h-8 flex-1 rounded border border-input px-2 text-[13px]"
            />
            <button type="button" className="text-[12px] text-[#888]" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
