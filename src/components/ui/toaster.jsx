import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
			{toasts.map(function ({ id, title, description, action, variant, ...props }) {
                if (variant === 'status') {
                    return (
                        <Toast key={id} variant={variant} {...props}>
                            <div className="grid gap-1 text-center w-full">
                                {title && (
                                    <ToastTitle className="text-2xl font-bold text-red-600" style={{ textShadow: '0 0 5px white, 0 0 10px white' }}>
                                        {title}
                                    </ToastTitle>
                                )}
                            </div>
                        </Toast>
                    );
                }
				return (
					<Toast key={id} {...props}>
						<div className="grid gap-1">
							{title && <ToastTitle>{title}</ToastTitle>}
							{description && (
								<ToastDescription>{description}</ToastDescription>
							)}
						</div>
						{action}
						<ToastClose />
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}