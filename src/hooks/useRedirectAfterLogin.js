import { useLocation, useNavigate } from 'react-router';
import { ROLE_HOME } from '@/constants/roles';

/** After sign in: return to the page that required auth, else the role's dashboard. */
export function useRedirectAfterLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  return (user) => {
    const from = location.state?.from;
    const target = from ? `${from.pathname}${from.search ?? ''}` : ROLE_HOME[user.role];
    navigate(target, { replace: true });
  };
}
