import { can, type Action } from './permissions'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector)

export const useCan = (action: Action): boolean => {
  const role = useAppSelector((s) => s.auth.user?.role)
  return can(role, action)
}
