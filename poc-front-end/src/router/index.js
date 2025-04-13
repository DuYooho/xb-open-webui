import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MedicalRecordView from '../views/MedicalRecordView.vue'
import PreConsultationView from '../views/PreConsultationView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/medical-record',
    name: 'medical-record',
    component: MedicalRecordView
  },
  {
    path: '/pre-consultation',
    name: 'pre-consultation',
    component: PreConsultationView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router