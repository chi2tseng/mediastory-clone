import { useStore } from '../../lib/store'
import type { Project } from '../../types'
import { MsIcon } from '../../components/MsIcon'
import { asset } from '../../lib/utils'

/**
 * The real "拍摄通告" page is a locked, image-rendered form for free accounts.
 * Two original assets are layered exactly as the production site does it:
 *   - callsheet-lock-bg.jpg  (the form screenshot)
 *   - callsheet-lock.png     (the upgrade card, with transparent shadow margins)
 * A 10% black wash sits between the two, so the form is dimmed but the card is not.
 */
export default function CallSheets({ project }: { project: Project }) {
  const { toast } = useStore()

  return (
    <div className="ms-callsheet-page">
      <div className="ms-callsheet-head">
        <h1 className="ms-callsheet-title">发布拍摄通告</h1>
        <span
          className="ms-callsheet-help"
          title="为拍摄日生成通告单，包含时间、地点、联系人和拍摄内容。"
        >
          <MsIcon name="icons_questionmark" size={14} />
        </span>
      </div>

      <div className="ms-callsheet-stage">
        <div className="ms-callsheet-art">
          <img
            className="ms-callsheet-bg"
            src={asset('/media/callsheet-lock-bg.jpg')}
            alt=""
            draggable={false}
          />
        </div>
        <div className="ms-callsheet-wash" aria-hidden="true" />
        <div className="ms-callsheet-lockwrap">
          <img
            className="ms-callsheet-lock"
            src={asset('/media/callsheet-lock.png')}
            alt="开通个人专业版，解锁拍摄通告"
            draggable={false}
          />
          <button
            type="button"
            className="ms-callsheet-buy"
            aria-label="开启个人专业版"
            onClick={() => toast('教学演示：专业版功能暂未开放')}
          />
        </div>
      </div>

      <span className="ms-callsheet-project" aria-hidden="true">
        {project.name}
      </span>
    </div>
  )
}
