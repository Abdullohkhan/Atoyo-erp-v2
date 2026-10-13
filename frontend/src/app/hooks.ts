import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'
import { can, type Permission } from './permissions'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector)

export const useCan = (perm: Permission): boolean => {
  const user = useAppSelector((s) => s.auth.user)
  return can(user, perm)
}
