import { redirect } from "next/navigation"

/** XMZADD 20260819 将课程目录入口统一返回学习中心，避免旧面包屑链接进入不存在页面。 */
export default function LearningLessonsPage() {
  redirect("/learning")
}
