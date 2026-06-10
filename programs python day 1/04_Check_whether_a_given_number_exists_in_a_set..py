set_new={1,89,32,89,61,67,98,87,2,1,5}
n=int(input())
flag=0
for i in set_new:
    if(i==n):
        flag=1
        break;
if(flag==1):
    print(" found " ,n)
else:
    print("not found " ,n)