import { redirect } from "next/navigation"

/** XMZADD 20260720 将停用的经验库旧入口兼容跳转到知识库。 */
export default function ExperiencesPage() {
  redirect("/knowledge")
}
