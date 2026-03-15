<script setup lang="ts">
import { onMounted } from 'vue'

const credits = [
  'Hình ảnh xe tăng 390: Lê Anh Dũng [https://imgs.vietnamnet.vn/Images/vnn/2015/04/23/15/20150423150052-1.jpg]',
  'Hình ảnh Dinh Độc Lập: [https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSb36zNVA2BkwgLZOLRUcw8FIleqgGi1kBVoI4PhtC6LuaOSm1spviQK320SYvIMY5pVsA&usqp=CAU]',
  'Hình ảnh cổng Dinh Độc Lập: Nguyễn Linh Phương Uyên',
]

onMounted(() => {
  console.log('Credits:')
  credits.forEach((line) => console.log(`- ${line}`))
})
</script>

<style scoped>
.credits {
  font-size: 0.75rem;
  color: #666;
}

.credits-details {
  padding: 0.5rem;
  border-radius: 4px;
  background: #f5f5f5;
}

.credits-details summary {
  cursor: pointer;
  font-weight: 500;
}

.credits-list {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
  line-height: 1.5;
}

.copy-btn {
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.copy-btn:hover {
  background: #eee;
}
</style>
